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

export async function invalidateBusinessCache() {
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

  const yearPrefix = `INV-${invoiceDate.getFullYear()}-`;
  const latestInvoices = await prisma.invoice.findMany({
    where: {
      userId: user.userId,
      invoiceNumber: { startsWith: yearPrefix },
    },
    select: { invoiceNumber: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  let maxSeq = 0;
  for (const inv of latestInvoices) {
    const seqStr = inv.invoiceNumber.replace(yearPrefix, "").split("-")[0];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  const totalCount = await prisma.invoice.count({
    where: { userId: user.userId },
  });
  const nextSeq = Math.max(maxSeq + 1, totalCount + 1);
  const invoiceNumber = `${yearPrefix}${String(nextSeq).padStart(4, "0")}`;

  const paidAmount = Number(data.paidAmount) || 0;
  const grandTotal = Number(data.total);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  let paymentStatus = "PAID";
  if (dueAmount > 0 && paidAmount > 0) paymentStatus = "PARTIAL";
  else if (dueAmount > 0 && paidAmount === 0) paymentStatus = "DUE";

  const createPayload = (num: string) => ({
    data: {
      userId: user.userId,
      invoiceNumber: num,
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
          notes: `Initial payment for ${num}`,
        },
      } : undefined,
    },
    include: {
      items: true,
      payments: true,
    },
  });

  let invoice;
  try {
    invoice = await prisma.invoice.create(createPayload(invoiceNumber));
  } catch (err: any) {
    if (err?.code === "P2002") {
      const fallbackNumber = `${yearPrefix}${String(nextSeq + 1).padStart(4, "0")}-${Date.now().toString().slice(-4)}`;
      invoice = await prisma.invoice.create(createPayload(fallbackNumber));
    } else {
      throw err;
    }
  }

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
  
  if (inv.dueAmount <= 0) {
    return inv;
  }

  const settleAmount = Math.min(amount, inv.dueAmount);
  const newPaid = inv.paidAmount + settleAmount;
  const newDue = Math.max(0, inv.dueAmount - settleAmount);
  const newStatus = newDue <= 0.01 ? "PAID" : "PARTIAL";

  await prisma.payment.create({
    data: {
      userId: user.userId,
      invoiceId: inv.id,
      customerId: inv.customerId,
      amount: settleAmount,
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
  const netProfit = grossProfit + totalOtherIncome - totalExpenses;
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


// ================= CREDITORS / SUPPLIERS =================
export async function getSuppliers() {
  const user = await requireUser();
  return await prisma.supplier.findMany({
    where: { userId: user.userId },
    include: {
      _count: {
        select: {
          purchases: true,
          supplierPayments: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSupplierById(id: string) {
  const user = await requireUser();
  return await prisma.supplier.findFirst({
    where: { id, userId: user.userId },
    include: {
      purchases: {
        orderBy: { date: "desc" },
        include: { items: true },
      },
      supplierPayments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });
}

export async function createSupplier(data: {
  name: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance?: number;
  paymentTerms?: string;
  notes?: string;
}) {
  const user = await requireUser();
  const count = await prisma.supplier.count({ where: { userId: user.userId } });
  const creditorCode = `CRED-${String(count + 1).padStart(6, "0")}`;
  const openingBal = Number(data.openingBalance) || 0;

  const supplier = await prisma.supplier.create({
    data: {
      userId: user.userId,
      creditorCode,
      name: data.name,
      businessName: data.businessName || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      openingBalance: openingBal,
      currentBalance: openingBal,
      paymentTerms: data.paymentTerms || "Net 30",
      notes: data.notes || null,
    },
  });

  // Log Audit
  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: "CREATE",
      entityType: "SUPPLIER",
      entityId: supplier.id,
      details: `Created creditor ${supplier.name} (${supplier.creditorCode}) with opening balance ₹${openingBal}`,
    },
  }).catch(() => null);

  invalidateBusinessCache();
  revalidatePath("/creditors");
  revalidatePath("/purchases");
  revalidatePath("/");
  return supplier;
}

export async function updateSupplier(
  id: string,
  data: {
    name?: string;
    businessName?: string;
    phone?: string;
    email?: string;
    address?: string;
    paymentTerms?: string;
    notes?: string;
  }
) {
  const user = await requireUser();
  const updated = await prisma.supplier.update({
    where: { id, userId: user.userId },
    data,
  });

  revalidatePath("/creditors");
  return updated;
}

export async function deleteSupplier(id: string) {
  const user = await requireUser();
  await prisma.supplier.delete({
    where: { id, userId: user.userId },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: "DELETE",
      entityType: "SUPPLIER",
      entityId: id,
      details: `Deleted creditor ID ${id}`,
    },
  }).catch(() => null);

  invalidateBusinessCache();
  revalidatePath("/creditors");
  revalidatePath("/");
  return { success: true };
}

export async function recordSupplierPayment(data: {
  supplierId: string;
  purchaseId?: string;
  amount: number;
  paymentMethod: string;
  paymentDate?: string;
  reference?: string;
  notes?: string;
}) {
  const user = await requireUser();
  const amt = Number(data.amount);
  if (amt <= 0) throw new Error("Payment amount must be greater than zero");

  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, userId: user.userId },
  });
  if (!supplier) throw new Error("Supplier not found");

  const targetDate = data.paymentDate || new Date().toISOString().split("T")[0];
  const dateObj = new Date(targetDate + "T12:00:00");

  const countTxn = await prisma.transaction.count({ where: { userId: user.userId } });
  const txnNumber = `TXN-${String(countTxn + 1).padStart(6, "0")}`;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Record payment
    const payment = await tx.supplierPayment.create({
      data: {
        userId: user.userId,
        supplierId: supplier.id,
        purchaseId: data.purchaseId || null,
        amount: amt,
        paymentMethod: data.paymentMethod || "CASH",
        dateString: targetDate,
        paymentDate: dateObj,
        reference: data.reference || null,
        notes: data.notes || `Payment made to ${supplier.name}`,
      },
    });

    // 2. Reduce creditor outstanding balance
    const newBal = Math.max(0, supplier.currentBalance - amt);
    await tx.supplier.update({
      where: { id: supplier.id },
      data: { currentBalance: newBal },
    });

    // 3. Update purchase if linked
    if (data.purchaseId) {
      const pur = await tx.purchase.findUnique({ where: { id: data.purchaseId } });
      if (pur) {
        const newPaid = pur.paidAmount + amt;
        const newDue = Math.max(0, pur.total - newPaid);
        await tx.purchase.update({
          where: { id: pur.id },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue,
            paymentStatus: newDue <= 0.01 ? "PAID" : "PARTIAL",
          },
        });
      }
    }

    // 4. Record unified money out transaction
    await tx.transaction.create({
      data: {
        userId: user.userId,
        txnNumber,
        type: "MONEY_OUT",
        category: "SUPPLIER_PAYMENT",
        amount: amt,
        paymentMode: data.paymentMethod || "CASH",
        partyName: supplier.name,
        reference: data.reference || null,
        description: `Payment to creditor ${supplier.name}`,
        date: dateObj,
        dateString: targetDate,
      },
    });

    // 5. Audit Log
    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: "SETTLE",
        entityType: "SUPPLIER",
        entityId: supplier.id,
        details: `Paid ₹${amt} to ${supplier.name} via ${data.paymentMethod}. New balance: ₹${newBal}`,
      },
    });

    return payment;
  });

  invalidateBusinessCache();
  revalidatePath("/creditors");
  revalidatePath("/purchases");
  revalidatePath("/transactions");
  revalidatePath("/daybook");
  revalidatePath("/");
  return result;
}

// ================= PURCHASES MANAGEMENT =================
export async function getPurchases(limit = 100) {
  const user = await requireUser();
  return await prisma.purchase.findMany({
    where: { userId: user.userId },
    include: {
      supplier: true,
      items: true,
      payments: true,
    },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createPurchase(data: {
  supplierId?: string;
  supplierName?: string;
  dateString?: string;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitCost: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  paymentMethod: string;
  notes?: string;
}) {
  const user = await requireUser();
  const dateStr = data.dateString || new Date().toISOString().split("T")[0];
  const dateObj = new Date(dateStr + "T12:00:00");

  const countPurchases = await prisma.purchase.count({ where: { userId: user.userId } });
  const purchaseNumber = `PUR-${String(countPurchases + 1).padStart(6, "0")}`;

  const dueAmount = Math.max(0, data.total - data.paidAmount);
  const paymentStatus = dueAmount <= 0.01 ? "PAID" : data.paidAmount > 0 ? "PARTIAL" : "UNPAID";

  const countTxn = await prisma.transaction.count({ where: { userId: user.userId } });
  const txnNumber = `TXN-${String(countTxn + 1).padStart(6, "0")}`;

  const purchase = await prisma.$transaction(async (tx) => {
    // 1. Create Purchase record
    const pur = await tx.purchase.create({
      data: {
        userId: user.userId,
        purchaseNumber,
        date: dateObj,
        dateString: dateStr,
        supplierId: data.supplierId || null,
        supplierName: data.supplierName || "Direct Supplier",
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
        paidAmount: data.paidAmount,
        dueAmount,
        paymentStatus,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    // 2. Increase stock for each product & create StockMovement
    for (const item of data.items) {
      if (item.productId) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const newStock = prod.stock + item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: newStock,
              costPrice: item.unitCost > 0 ? item.unitCost : prod.costPrice,
            },
          });

          await tx.stockMovement.create({
            data: {
              userId: user.userId,
              productId: item.productId,
              type: "PURCHASE",
              quantity: item.quantity,
              previousStock: prod.stock,
              newStock,
              reason: `Stock purchased on ${purchaseNumber}`,
              referenceId: purchaseNumber,
            },
          });
        }
      }
    }

    // 3. Update Creditor balance & log payment if supplier linked
    if (data.supplierId) {
      const supp = await tx.supplier.findUnique({ where: { id: data.supplierId } });
      if (supp) {
        // If there's an unpaid due, add it to supplier balance
        const updatedBal = supp.currentBalance + dueAmount;
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { currentBalance: updatedBal },
        });

        // If initial amount paid, record SupplierPayment
        if (data.paidAmount > 0) {
          await tx.supplierPayment.create({
            data: {
              userId: user.userId,
              supplierId: supp.id,
              purchaseId: pur.id,
              amount: data.paidAmount,
              paymentMethod: data.paymentMethod,
              dateString: dateStr,
              paymentDate: dateObj,
              notes: `Initial payment for ${purchaseNumber}`,
            },
          });
        }
      }
    }

    // 4. Record Money Out transaction for paid portion
    if (data.paidAmount > 0) {
      await tx.transaction.create({
        data: {
          userId: user.userId,
          txnNumber,
          type: "MONEY_OUT",
          category: "PURCHASE",
          amount: data.paidAmount,
          paymentMode: data.paymentMethod,
          partyName: data.supplierName || "Supplier",
          reference: purchaseNumber,
          description: `Purchase bill ${purchaseNumber}`,
          date: dateObj,
          dateString: dateStr,
        },
      });
    }

    // 5. Audit Log
    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: "CREATE",
        entityType: "PURCHASE",
        entityId: pur.id,
        details: `Recorded purchase ${purchaseNumber} from ${data.supplierName || "Supplier"} for ₹${data.total}`,
      },
    });

    return pur;
  });

  invalidateBusinessCache();
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/creditors");
  revalidatePath("/transactions");
  revalidatePath("/daybook");
  revalidatePath("/");
  return purchase;
}

// ================= STOCK MOVEMENTS & ADJUSTMENTS =================
export async function getStockMovements(productId?: string) {
  const user = await requireUser();
  return await prisma.stockMovement.findMany({
    where: {
      userId: user.userId,
      ...(productId ? { productId } : {}),
    },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function adjustStock(data: {
  productId: string;
  type: "DAMAGE" | "RETURN" | "ADJUSTMENT" | "PURCHASE" | "SALE";
  quantity: number;
  reason?: string;
}) {
  const user = await requireUser();
  const prod = await prisma.product.findFirst({
    where: { id: data.productId, userId: user.userId },
  });
  if (!prod) throw new Error("Product not found");

  const qty = Number(data.quantity);
  const newStock = prod.stock + qty;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: data.productId },
      data: { stock: newStock },
    });

    await tx.stockMovement.create({
      data: {
        userId: user.userId,
        productId: data.productId,
        type: data.type,
        quantity: qty,
        previousStock: prod.stock,
        newStock,
        reason: data.reason || `Manual ${data.type} adjustment`,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: "UPDATE",
        entityType: "PRODUCT",
        entityId: data.productId,
        details: `Stock adjustment on ${prod.name}: ${qty > 0 ? "+" + qty : qty}. New stock: ${newStock}`,
      },
    });

    return updated;
  });

  revalidatePath("/inventory");
  revalidatePath("/billing");
  return result;
}

export async function getInventoryValuation() {
  const user = await requireUser();
  const products = await prisma.product.findMany({
    where: { userId: user.userId },
  });

  let totalStockCount = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let lowStockCount = 0;

  for (const p of products) {
    const stock = Math.max(0, p.stock);
    totalStockCount += stock;
    totalCostValue += stock * (p.costPrice || 0);
    totalRetailValue += stock * p.sellingPrice;
    if (p.stock <= (p.minStockLevel || 5)) {
      lowStockCount++;
    }
  }

  const potentialGrossProfit = totalRetailValue - totalCostValue;

  return {
    totalProducts: products.length,
    totalStockCount,
    totalCostValue,
    totalRetailValue,
    potentialGrossProfit,
    lowStockCount,
  };
}

// ================= BANK & UPI ACCOUNTS =================
export async function getBankAccounts() {
  const user = await requireUser();
  return await prisma.bankAccount.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createBankAccount(data: {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode?: string;
  upiId?: string;
  balance?: number;
  isPrimary?: boolean;
}) {
  const user = await requireUser();
  const bal = Number(data.balance) || 0;

  const account = await prisma.bankAccount.create({
    data: {
      userId: user.userId,
      bankName: data.bankName,
      accountHolder: data.accountHolder,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode || null,
      upiId: data.upiId || null,
      balance: bal,
      isPrimary: data.isPrimary ?? false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: "CREATE",
      entityType: "BANK",
      entityId: account.id,
      details: `Added bank account ${account.bankName} (${account.accountNumber.slice(-4)}) with initial ₹${bal}`,
    },
  }).catch(() => null);

  invalidateBusinessCache();
  revalidatePath("/bank");
  revalidatePath("/");
  return account;
}

export async function updateBankAccount(
  id: string,
  data: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    balance?: number;
    isPrimary?: boolean;
  }
) {
  const user = await requireUser();
  const updated = await prisma.bankAccount.update({
    where: { id, userId: user.userId },
    data,
  });

  revalidatePath("/bank");
  return updated;
}

export async function deleteBankAccount(id: string) {
  const user = await requireUser();
  await prisma.bankAccount.delete({
    where: { id, userId: user.userId },
  });

  invalidateBusinessCache();
  revalidatePath("/bank");
  revalidatePath("/");
  return { success: true };
}

export async function recordBankTransfer(data: {
  bankAccountId: string;
  direction: "CASH_TO_BANK" | "BANK_TO_CASH";
  amount: number;
  reference?: string;
  notes?: string;
}) {
  const user = await requireUser();
  const amt = Number(data.amount);
  if (amt <= 0) throw new Error("Amount must be greater than zero");

  const bank = await prisma.bankAccount.findFirst({
    where: { id: data.bankAccountId, userId: user.userId },
  });
  if (!bank) throw new Error("Bank account not found");

  const today = new Date().toISOString().split("T")[0];
  const dateObj = new Date();
  const countTxn = await prisma.transaction.count({ where: { userId: user.userId } });
  const txnNumber = `TXN-${String(countTxn + 1).padStart(6, "0")}`;

  const newBalance =
    data.direction === "CASH_TO_BANK" ? bank.balance + amt : Math.max(0, bank.balance - amt);

  const res = await prisma.$transaction(async (tx) => {
    // 1. Update bank balance
    await tx.bankAccount.update({
      where: { id: bank.id },
      data: { balance: newBalance },
    });

    // 2. Record Transaction
    await tx.transaction.create({
      data: {
        userId: user.userId,
        txnNumber,
        type: "TRANSFER",
        category: "BANK_TRANSFER",
        amount: amt,
        paymentMode: data.direction === "CASH_TO_BANK" ? "CASH" : "BANK_TRANSFER",
        partyName: bank.bankName,
        reference: data.reference || null,
        description:
          data.direction === "CASH_TO_BANK"
            ? `Cash deposited into ${bank.bankName} (${bank.accountNumber.slice(-4)})`
            : `Cash withdrawn from ${bank.bankName} (${bank.accountNumber.slice(-4)})`,
        date: dateObj,
        dateString: today,
      },
    });

    // 3. Audit Log
    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: "UPDATE",
        entityType: "BANK",
        entityId: bank.id,
        details: `Transfer of ₹${amt} [${data.direction}]. New balance: ₹${newBalance}`,
      },
    });

    return { newBalance };
  });

  invalidateBusinessCache();
  revalidatePath("/bank");
  revalidatePath("/daybook");
  revalidatePath("/transactions");
  revalidatePath("/");
  return res;
}

// ================= MASTER UNIFIED TRANSACTIONS & AUDIT LOG =================
export async function getTransactions(options?: {
  category?: string;
  type?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) {
  const user = await requireUser();
  const limit = options?.limit || 100;

  const where: any = { userId: user.userId };
  if (options?.category && options.category !== "ALL") {
    where.category = options.category;
  }
  if (options?.type && options.type !== "ALL") {
    where.type = options.type;
  }
  if (options?.startDate || options?.endDate) {
    where.dateString = {};
    if (options.startDate) where.dateString.gte = options.startDate;
    if (options.endDate) where.dateString.lte = options.endDate;
  }

  return await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getAuditLogs(limit = 100) {
  const user = await requireUser();
  return await prisma.auditLog.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ================= STAFF MANAGEMENT =================
export async function getStaffMembers() {
  const user = await requireUser();
  return await prisma.staffMember.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createStaffMember(data: {
  name: string;
  phone: string;
  role: string;
  pin?: string;
  salary?: number;
  permissions?: string;
}) {
  const user = await requireUser();
  const staff = await prisma.staffMember.create({
    data: {
      userId: user.userId,
      name: data.name,
      phone: data.phone,
      role: data.role || "STAFF",
      pin: data.pin || null,
      salary: data.salary ? Number(data.salary) : null,
      permissions: data.permissions || JSON.stringify(["billing", "customers"]),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: "CREATE",
      entityType: "STAFF",
      entityId: staff.id,
      details: `Added staff member ${staff.name} (${staff.role})`,
    },
  }).catch(() => null);

  revalidatePath("/staff");
  return staff;
}

export async function updateStaffMember(
  id: string,
  data: {
    name?: string;
    phone?: string;
    role?: string;
    pin?: string;
    salary?: number;
    isActive?: boolean;
    permissions?: string;
  }
) {
  const user = await requireUser();
  const updated = await prisma.staffMember.update({
    where: { id, userId: user.userId },
    data,
  });

  revalidatePath("/staff");
  return updated;
}

export async function deleteStaffMember(id: string) {
  const user = await requireUser();
  await prisma.staffMember.delete({
    where: { id, userId: user.userId },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: "DELETE",
      entityType: "STAFF",
      entityId: id,
      details: `Removed staff member ID ${id}`,
    },
  }).catch(() => null);

  revalidatePath("/staff");
  return { success: true };
}

// ================= REAL-TIME SYSTEM NOTIFICATIONS =================
export async function getSystemNotifications() {
  const user = await requireUser();
  const today = new Date().toISOString().split("T")[0];

  // 1. Low stock products
  const products = await prisma.product.findMany({
    where: { userId: user.userId },
  });
  const lowStock = products.filter((p) => p.stock <= (p.minStockLevel || 5));

  // 2. Customers with outstanding balance
  const customers = await prisma.customer.findMany({
    where: { userId: user.userId },
    include: {
      invoices: { select: { dueAmount: true } },
    },
  });
  const debtorsWithDues = customers
    .map((c) => ({
      name: c.name,
      phone: c.phone,
      due: c.invoices.reduce((s, i) => s + i.dueAmount, 0),
    }))
    .filter((c) => c.due > 0.01);

  // 3. Creditors with outstanding balance
  const creditors = await prisma.supplier.findMany({
    where: { userId: user.userId, currentBalance: { gt: 0 } },
  });

  // 4. Daybook status for today
  const daybook = await prisma.daybookRegister.findFirst({
    where: { userId: user.userId, dateString: today },
  });

  const alerts = [];

  if (lowStock.length > 0) {
    alerts.push({
      id: "alert-low-stock",
      type: "WARNING",
      title: `${lowStock.length} Products Low in Stock`,
      description: `Stock is below safe threshold for ${lowStock.slice(0, 3).map((p) => p.name).join(", ")}${lowStock.length > 3 ? "..." : ""}`,
      link: "/inventory",
    });
  }

  if (debtorsWithDues.length > 0) {
    const totalDebtorDue = debtorsWithDues.reduce((s, d) => s + d.due, 0);
    alerts.push({
      id: "alert-debtors",
      type: "INFO",
      title: `₹${totalDebtorDue.toLocaleString("en-IN")} Pending in Khata`,
      description: `${debtorsWithDues.length} customers have pending payment due.`,
      link: "/customers",
    });
  }

  if (creditors.length > 0) {
    const totalPayable = creditors.reduce((s, c) => s + c.currentBalance, 0);
    alerts.push({
      id: "alert-creditors",
      type: "WARNING",
      title: `₹${totalPayable.toLocaleString("en-IN")} Payable to Creditors`,
      description: `You owe balance to ${creditors.length} suppliers/creditors.`,
      link: "/creditors",
    });
  }

  if (!daybook || !daybook.isClosed) {
    alerts.push({
      id: "alert-daybook",
      type: "REMINDER",
      title: "Today's Daybook is Open",
      description: "Remember to tally Galla cash and lock your daybook before closing shop tonight.",
      link: "/daybook",
    });
  }

  return alerts;
}
