"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { cache } from "react";

// Short-lived in-memory server cache for ultra-fast instantaneous navigation (0ms)
interface DaybookCacheEntry {
  key: string;
  data: any;
  ts: number;
}
let serverDaybookCache: DaybookCacheEntry | null = null;
let serverCustomerDuesCache: { userId: string; dues: number; ts: number } | null = null;

export function invalidateBusinessCache() {
  serverDaybookCache = null;
  serverCustomerDuesCache = null;
}

// ================= BUSINESS PROFILE =================
// Fast memoized profile read avoiding repeated write upsert transactions
export const getBusinessProfile = cache(async () => {
  const user = await requireUser();
  let profile = await prisma.businessProfile.findUnique({
    where: { userId: user.userId },
  });

  if (!profile) {
    profile = await prisma.businessProfile.create({
      data: {
        userId: user.userId,
        name: `${user.name}'s Store`,
        currency: "₹",
        taxRate: 0.0,
        email: user.email,
      },
    });
  }

  return profile;
});

export async function updateBusinessProfile(data: {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  currency: string;
  receiptFooter: string;
  taxRate: number;
}) {
  const user = await requireUser();
  const updated = await prisma.businessProfile.upsert({
    where: { userId: user.userId },
    update: data,
    create: { userId: user.userId, ...data },
  });
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/billing");
  revalidatePath("/settings");
  return updated;
}

// ================= PRODUCTS / INVENTORY =================
export async function getProducts() {
  const user = await requireUser();
  return await prisma.product.findMany({
    where: { userId: user.userId },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(data: {
  name: string;
  sku?: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
}) {
  const user = await requireUser();
  const prod = await prisma.product.create({
    data: {
      userId: user.userId,
      name: data.name,
      sku: data.sku || undefined,
      category: data.category || "General",
      costPrice: Number(data.costPrice) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      stock: Number(data.stock) || 0,
      unit: data.unit || "pcs",
    },
  });
  revalidatePath("/inventory");
  revalidatePath("/billing");
  return prod;
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    sku?: string;
    category?: string;
    costPrice?: number;
    sellingPrice?: number;
    stock?: number;
    unit?: string;
  }
) {
  const user = await requireUser();
  const prod = await prisma.product.update({
    where: { id, userId: user.userId },
    data: {
      ...data,
      costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
      sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : undefined,
      stock: data.stock !== undefined ? Number(data.stock) : undefined,
    },
  });
  revalidatePath("/inventory");
  revalidatePath("/billing");
  return prod;
}

export async function deleteProduct(id: string) {
  const user = await requireUser();
  await prisma.product.delete({
    where: { id, userId: user.userId },
  });
  revalidatePath("/inventory");
  revalidatePath("/billing");
  return { success: true };
}

// ================= CUSTOMERS & KHATA =================
export async function getCustomers() {
  const user = await requireUser();
  const customers = await prisma.customer.findMany({
    where: { userId: user.userId },
    include: {
      invoices: {
        select: {
          total: true,
          paidAmount: true,
          dueAmount: true,
          paymentStatus: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return customers.map((c) => {
    const totalDues = c.invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
    return {
      ...c,
      totalDues,
    };
  });
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const user = await requireUser();
  const cust = await prisma.customer.create({
    data: {
      ...data,
      userId: user.userId,
    },
  });
  revalidatePath("/customers");
  revalidatePath("/billing");
  return cust;
}

export async function getTotalCustomerDues(): Promise<number> {
  const user = await requireUser();
  if (
    serverCustomerDuesCache &&
    serverCustomerDuesCache.userId === user.userId &&
    Date.now() - serverCustomerDuesCache.ts < 20000
  ) {
    return serverCustomerDuesCache.dues;
  }
  const agg = await prisma.invoice.aggregate({
    where: { userId: user.userId, dueAmount: { gt: 0 } },
    _sum: { dueAmount: true },
  });
  const dues = agg._sum.dueAmount || 0;
  serverCustomerDuesCache = { userId: user.userId, dues, ts: Date.now() };
  return dues;
}

export async function recordCustomerPayment(data: {
  customerId: string;
  amount: number;
  paymentMethod: string;
  dateString?: string;
  notes?: string;
}) {
  const user = await requireUser();
  const targetDateStr = data.dateString || new Date().toISOString().split("T")[0];
  const paymentDate = data.dateString ? new Date(data.dateString + "T12:00:00") : new Date();

  const payment = await prisma.payment.create({
    data: {
      userId: user.userId,
      customerId: data.customerId,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod || "CASH",
      dateString: targetDateStr,
      paymentDate,
      notes: data.notes || "Khata due clearance",
    },
  });

  // Automatically settle oldest pending customer invoices with this payment
  let remainingPayment = Number(data.amount);
  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      userId: user.userId,
      customerId: data.customerId,
      dueAmount: { gt: 0 },
    },
    orderBy: { date: "asc" },
  });

  for (const inv of pendingInvoices) {
    if (remainingPayment <= 0) break;
    const settle = Math.min(remainingPayment, inv.dueAmount);
    const newPaid = inv.paidAmount + settle;
    const newDue = inv.dueAmount - settle;
    const newStatus = newDue <= 0.01 ? "PAID" : "PARTIAL";

    await prisma.invoice.update({
      where: { id: inv.id, userId: user.userId },
      data: {
        paidAmount: newPaid,
        dueAmount: Math.max(0, newDue),
        paymentStatus: newStatus,
      },
    });

    remainingPayment -= settle;
  }

  invalidateBusinessCache();
  revalidatePath("/customers");
  revalidatePath("/daybook");
  revalidatePath("/");
  return payment;
}

// ================= INVOICES & BILLING =================
export async function getInvoices(limit = 50, dateString?: string) {
  const user = await requireUser();
  return await prisma.invoice.findMany({
    where: {
      userId: user.userId,
      ...(dateString ? { dateString } : {}),
    },
    include: {
      items: true,
      payments: true,
    },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createInvoice(data: {
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  paymentMethod: "CASH" | "UPI" | "CARD" | "CREDIT";
  notes?: string;
  dateString?: string;
}) {
  const user = await requireUser();
  const targetDateStr = data.dateString || new Date().toISOString().split("T")[0];
  const invoiceDate = data.dateString ? new Date(data.dateString + "T12:00:00") : new Date();

  const count = await prisma.invoice.count({
    where: { userId: user.userId },
  });
  const invoiceNumber = `INV-${invoiceDate.getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const paidAmount = Number(data.paidAmount) || 0;
  const grandTotal = Number(data.total);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  let paymentStatus = "PAID";
  if (dueAmount > 0 && paidAmount > 0) paymentStatus = "PARTIAL";
  else if (dueAmount > 0 && paidAmount === 0) paymentStatus = "DUE";

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.userId,
      invoiceNumber,
      date: invoiceDate,
      dateString: targetDateStr,
      customerId: data.customerId || null,
      customerName: data.customerName || "Walk-in Customer",
      customerPhone: data.customerPhone || null,
      subtotal: data.subtotal,
      discount: data.discount,
      tax: data.tax,
      total: grandTotal,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentMethod: data.paymentMethod,
      notes: data.notes || null,
      items: {
        create: data.items
          .filter((item) => item.quantity > 0)
          .map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
      },
      payments: paidAmount > 0 ? {
        create: {
          userId: user.userId,
          customerId: data.customerId || null,
          amount: paidAmount,
          paymentMethod: data.paymentMethod === "CREDIT" ? "CASH" : data.paymentMethod,
          dateString: targetDateStr,
          paymentDate: invoiceDate,
          notes: `Initial payment for ${invoiceNumber}`,
        },
      } : undefined,
    },
    include: {
      items: true,
      payments: true,
    },
  });

  // Deduct stock for products included
  for (const item of data.items) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId, userId: user.userId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      }).catch(() => null); // ignore if product deleted
    }
  }

  invalidateBusinessCache();
  revalidatePath("/billing");
  revalidatePath("/daybook");
  revalidatePath("/customers");
  revalidatePath("/inventory");
  revalidatePath("/");
  return invoice;
}

export async function markInvoicePaid(
  invoiceId: string,
  amount: number,
  paymentMethod: string,
  dateString?: string
) {
  const user = await requireUser();
  const inv = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: user.userId },
  });
  if (!inv) throw new Error("Invoice not found");

  const targetDateStr = dateString || new Date().toISOString().split("T")[0];
  const paymentDate = dateString ? new Date(dateString + "T12:00:00") : new Date();
  const newPaid = inv.paidAmount + amount;
  const newDue = Math.max(0, inv.total - newPaid);
  const newStatus = newDue <= 0.01 ? "PAID" : "PARTIAL";

  await prisma.payment.create({
    data: {
      userId: user.userId,
      invoiceId: inv.id,
      customerId: inv.customerId,
      amount,
      paymentMethod,
      dateString: targetDateStr,
      paymentDate,
      notes: `Payment for ${inv.invoiceNumber}`,
    },
  });

  const updated = await prisma.invoice.update({
    where: { id: invoiceId, userId: user.userId },
    data: {
      paidAmount: newPaid,
      dueAmount: newDue,
      paymentStatus: newStatus,
    },
  });

  invalidateBusinessCache();
  revalidatePath("/billing");
  revalidatePath("/daybook");
  revalidatePath("/customers");
  revalidatePath("/");
  return updated;
}

// ================= DAILY EXPENSES & INCOME =================
export async function getExpenses(limit = 100, dateString?: string) {
  const user = await requireUser();
  return await prisma.expense.findMany({
    where: {
      userId: user.userId,
      ...(dateString ? { dateString } : {}),
    },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createExpense(data: {
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  dateString?: string;
  reference?: string;
  notes?: string;
}) {
  const user = await requireUser();
  const targetDateStr = data.dateString || new Date().toISOString().split("T")[0];
  const expenseDate = data.dateString ? new Date(data.dateString + "T12:00:00") : new Date();

  const expense = await prisma.expense.create({
    data: {
      userId: user.userId,
      title: data.title,
      category: data.category || "General",
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod || "CASH",
      date: expenseDate,
      dateString: targetDateStr,
      reference: data.reference || null,
      notes: data.notes || null,
    },
  });

  invalidateBusinessCache();
  revalidatePath("/expenses");
  revalidatePath("/daybook");
  revalidatePath("/");
  return expense;
}

export async function deleteExpense(id: string) {
  const user = await requireUser();
  await prisma.expense.delete({
    where: { id, userId: user.userId },
  });
  invalidateBusinessCache();
  revalidatePath("/expenses");
  revalidatePath("/daybook");
  revalidatePath("/");
  return { success: true };
}

export async function getOtherIncomes(limit = 100, dateString?: string) {
  const user = await requireUser();
  return await prisma.otherIncome.findMany({
    where: {
      userId: user.userId,
      ...(dateString ? { dateString } : {}),
    },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createOtherIncome(data: {
  title: string;
  source: string;
  amount: number;
  paymentMethod: string;
  dateString?: string;
  notes?: string;
}) {
  const user = await requireUser();
  const targetDateStr = data.dateString || new Date().toISOString().split("T")[0];
  const incomeDate = data.dateString ? new Date(data.dateString + "T12:00:00") : new Date();

  const income = await prisma.otherIncome.create({
    data: {
      userId: user.userId,
      title: data.title,
      source: data.source || "Misc",
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod || "CASH",
      date: incomeDate,
      dateString: targetDateStr,
      notes: data.notes || null,
    },
  });

  invalidateBusinessCache();
  revalidatePath("/expenses");
  revalidatePath("/daybook");
  revalidatePath("/");
  return income;
}

export async function deleteOtherIncome(id: string) {
  const user = await requireUser();
  await prisma.otherIncome.delete({
    where: { id, userId: user.userId },
  });
  invalidateBusinessCache();
  revalidatePath("/expenses");
  revalidatePath("/daybook");
  revalidatePath("/");
  return { success: true };
}

// ================= DAYBOOK & DAILY BUSINESS RECORDS =================
export async function getDaybook(dateString?: string) {
  const user = await requireUser();
  const targetDate = dateString || new Date().toISOString().split("T")[0];
  const cacheKey = `${user.userId}_${targetDate}`;

  if (
    serverDaybookCache &&
    serverDaybookCache.key === cacheKey &&
    Date.now() - serverDaybookCache.ts < 20000
  ) {
    return serverDaybookCache.data;
  }

  // Fetch or create daybook register entry for this user
  let register = await prisma.daybookRegister.findUnique({
    where: {
      userId_dateString: {
        userId: user.userId,
        dateString: targetDate,
      },
    },
  });

  // Calculate day totals
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.userId, dateString: targetDate },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const payments = await prisma.payment.findMany({
    where: { userId: user.userId, dateString: targetDate },
    include: { customer: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });

  const expenses = await prisma.expense.findMany({
    where: { userId: user.userId, dateString: targetDate },
    orderBy: { createdAt: "desc" },
  });

  const otherIncomes = await prisma.otherIncome.findMany({
    where: { userId: user.userId, dateString: targetDate },
    orderBy: { createdAt: "desc" },
  });

  // Calculate Cash movements
  const cashPayments = payments.filter((p) => p.paymentMethod === "CASH");
  const cashOtherIncome = otherIncomes.filter((i) => i.paymentMethod === "CASH");
  const cashExpenses = expenses.filter((e) => e.paymentMethod === "CASH");

  const totalCashIn =
    cashPayments.reduce((s, p) => s + p.amount, 0) +
    cashOtherIncome.reduce((s, i) => s + i.amount, 0);

  const totalCashOut = cashExpenses.reduce((s, e) => s + e.amount, 0);

  const openingCash = register ? register.openingCash : 2000;
  const expectedCash = openingCash + totalCashIn - totalCashOut;

  // Build unified chronological activity events
  const events: any[] = [];

  for (const inv of invoices) {
    events.push({
      id: inv.id,
      timestamp: new Date(inv.date).getTime(),
      type: "INVOICE",
      title: `Bill ${inv.invoiceNumber} (${inv.customerName})`,
      subtitle: `${inv.items.length} items • Status: ${inv.paymentStatus}`,
      amount: inv.total,
      paidAmount: inv.paidAmount,
      isIncome: true,
      paymentMethod: inv.paymentMethod,
      time: new Date(inv.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      raw: inv,
    });
  }

  for (const exp of expenses) {
    events.push({
      id: exp.id,
      timestamp: new Date(exp.date).getTime(),
      type: "EXPENSE",
      title: `${exp.title}`,
      subtitle: `Category: ${exp.category} ${exp.reference ? "• Ref: " + exp.reference : ""}`,
      amount: exp.amount,
      isIncome: false,
      paymentMethod: exp.paymentMethod,
      time: new Date(exp.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      raw: exp,
    });
  }

  for (const inc of otherIncomes) {
    events.push({
      id: inc.id,
      timestamp: new Date(inc.date).getTime(),
      type: "OTHER_INCOME",
      title: `${inc.title}`,
      subtitle: `Source: ${inc.source}`,
      amount: inc.amount,
      isIncome: true,
      paymentMethod: inc.paymentMethod,
      time: new Date(inc.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      raw: inc,
    });
  }

  // Khata repayments not tied directly to today's invoice
  const standalonePayments = payments.filter((p) => p.customerId && !p.invoiceId);
  for (const pay of standalonePayments) {
    events.push({
      id: pay.id,
      timestamp: new Date(pay.paymentDate).getTime(),
      type: "CUSTOMER_PAYMENT",
      title: `Khata Repayment: ${pay.customer?.name || "Customer"}`,
      subtitle: pay.notes || "Due collection",
      amount: pay.amount,
      isIncome: true,
      paymentMethod: pay.paymentMethod,
      time: new Date(pay.paymentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      raw: pay,
    });
  }

  // Sort events chronologically (latest first)
  events.sort((a, b) => b.timestamp - a.timestamp);

  const result = {
    dateString: targetDate,
    register: register || {
      id: "temp",
      dateString: targetDate,
      openingCash,
      cashInflow: totalCashIn,
      cashOutflow: totalCashOut,
      expectedCash,
      actualCash: null,
      difference: null,
      isClosed: false,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    metrics: {
      openingCash,
      totalCashIn,
      totalCashOut,
      expectedCash,
      totalSalesAllModes: invoices.reduce((s, i) => s + i.total, 0),
      totalExpensesAllModes: expenses.reduce((s, e) => s + e.amount, 0),
      totalOtherIncomeAllModes: otherIncomes.reduce((s, i) => s + i.amount, 0),
      netDailyProfit:
        invoices.reduce((s, i) => s + i.total, 0) +
        otherIncomes.reduce((s, i) => s + i.amount, 0) -
        expenses.reduce((s, e) => s + e.amount, 0),
    },
    events,
    invoices,
    expenses,
  };

  serverDaybookCache = { key: cacheKey, data: result, ts: Date.now() };
  return result;
}

export async function saveDaybookRegister(data: {
  dateString: string;
  openingCash: number;
  actualCash?: number;
  notes?: string;
  isClosed?: boolean;
}) {
  const user = await requireUser();
  const dayData = await getDaybook(data.dateString);
  const opening = Number(data.openingCash) || 0;
  const expected = opening + dayData.metrics.totalCashIn - dayData.metrics.totalCashOut;
  const actual = data.actualCash !== undefined ? Number(data.actualCash) : null;
  const diff = actual !== null ? actual - expected : null;

  const reg = await prisma.daybookRegister.upsert({
    where: {
      userId_dateString: {
        userId: user.userId,
        dateString: data.dateString,
      },
    },
    update: {
      openingCash: opening,
      cashInflow: dayData.metrics.totalCashIn,
      cashOutflow: dayData.metrics.totalCashOut,
      expectedCash: expected,
      actualCash: actual,
      difference: diff,
      notes: data.notes || null,
      isClosed: data.isClosed ?? false,
    },
    create: {
      userId: user.userId,
      dateString: data.dateString,
      openingCash: opening,
      cashInflow: dayData.metrics.totalCashIn,
      cashOutflow: dayData.metrics.totalCashOut,
      expectedCash: expected,
      actualCash: actual,
      difference: diff,
      notes: data.notes || null,
      isClosed: data.isClosed ?? false,
    },
  });

  invalidateBusinessCache();
  revalidatePath("/daybook");
  revalidatePath("/");
  return reg;
}

// ================= REPORTS & ANALYTICS =================
export async function getReports(startDate?: string, endDate?: string) {
  const user = await requireUser();
  const today = new Date().toISOString().split("T")[0];
  const dStart = startDate || today;
  const dEnd = endDate || today;

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: user.userId,
      dateString: {
        gte: dStart,
        lte: dEnd,
      },
    },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.userId,
      dateString: {
        gte: dStart,
        lte: dEnd,
      },
    },
  });

  const otherIncomes = await prisma.otherIncome.findMany({
    where: {
      userId: user.userId,
      dateString: {
        gte: dStart,
        lte: dEnd,
      },
    },
  });

  const totalSales = invoices.reduce((s, i) => s + i.total, 0);
  const totalOtherIncome = otherIncomes.reduce((s, i) => s + i.amount, 0);
  const totalRevenue = totalSales + totalOtherIncome;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // Calculate Cost of Goods Sold (COGS)
  let cogs = 0;
  for (const inv of invoices) {
    for (const item of inv.items) {
      const cost = item.product?.costPrice || 0;
      cogs += cost * item.quantity;
    }
  }

  const grossProfit = totalSales - cogs;
  const netProfit = totalRevenue - totalExpenses;
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // Expense breakdown by category
  const expenseByCategory: Record<string, number> = {};
  for (const exp of expenses) {
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
  }
  const expenseCategories = Object.entries(expenseByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // Payment method breakdown for sales
  const salesByPaymentMethod: Record<string, number> = {};
  for (const inv of invoices) {
    salesByPaymentMethod[inv.paymentMethod] = (salesByPaymentMethod[inv.paymentMethod] || 0) + inv.total;
  }
  const paymentMethods = Object.entries(salesByPaymentMethod).map(([method, amount]) => ({
    name: method,
    value: amount,
  }));

  // Top products sold
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const inv of invoices) {
    for (const item of inv.items) {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      productSalesMap[item.productName].quantity += item.quantity;
      productSalesMap[item.productName].revenue += item.total;
    }
  }
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    startDate: dStart,
    endDate: dEnd,
    totalSales,
    totalOtherIncome,
    totalRevenue,
    cogs,
    grossProfit,
    totalExpenses,
    netProfit,
    profitMarginPercent,
    invoicesCount: invoices.length,
    expensesCount: expenses.length,
    expenseCategories,
    paymentMethods,
    topProducts,
  };
}
