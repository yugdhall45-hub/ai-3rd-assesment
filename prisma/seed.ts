import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getDayInfo(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(12, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    date: d,
    dateString: `${year}-${month}-${day}`,
  };
}

async function main() {
  console.log("Seeding database with demo business account & 14-day historical records...");

  // 1. Create or get Demo User
  const demoEmail = "demo@smartbazaar.local";
  const hashedPassword = await bcrypt.hash("smart123", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      name: "SmartBazaar Store Manager",
      password: hashedPassword,
    },
    create: {
      email: demoEmail,
      name: "SmartBazaar Store Manager",
      password: hashedPassword,
    },
  });

  const userId = demoUser.id;
  console.log(`Demo User ID: ${userId} (${demoEmail})`);

  // 2. Business Profile
  await prisma.businessProfile.upsert({
    where: { userId },
    update: {
      name: "SmartBazaar Local Mart",
      tagline: "Your Trusted Neighborhood Store & Daily Needs",
      phone: "+91 98765 43210",
      email: demoEmail,
      address: "Shop #14, Sunrise Plaza, MG Road, City Center",
      taxId: "GSTIN: 27AABCS1429B1Z8",
      currency: "₹",
      taxRate: 5.0,
      receiptFooter: "Thank you for shopping with us! Fresh groceries every day.",
    },
    create: {
      userId,
      name: "SmartBazaar Local Mart",
      tagline: "Your Trusted Neighborhood Store & Daily Needs",
      phone: "+91 98765 43210",
      email: demoEmail,
      address: "Shop #14, Sunrise Plaza, MG Road, City Center",
      taxId: "GSTIN: 27AABCS1429B1Z8",
      currency: "₹",
      taxRate: 5.0,
      receiptFooter: "Thank you for shopping with us! Fresh groceries every day.",
    },
  });

  // 3. Products
  const products = [
    { name: "Basmati Rice Premium 5kg", sku: "RIC-5KG", category: "Grains & Pulses", costPrice: 380, sellingPrice: 460, stock: 45, unit: "bag" },
    { name: "Fortune Sunflower Oil 1L", sku: "OIL-1L", category: "Oils & Ghee", costPrice: 125, sellingPrice: 155, stock: 60, unit: "pouch" },
    { name: "Aashirvaad Shudh Chakki Atta 10kg", sku: "ATT-10KG", category: "Flour & Atta", costPrice: 360, sellingPrice: 420, stock: 30, unit: "bag" },
    { name: "Tata Gold Tea Leaves 500g", sku: "TEA-500G", category: "Beverages", costPrice: 210, sellingPrice: 260, stock: 50, unit: "pack" },
    { name: "Madhur Pure & Hygienic Sugar 1kg", sku: "SUG-1KG", category: "Essentials", costPrice: 42, sellingPrice: 50, stock: 120, unit: "kg" },
    { name: "Amul Taaza Homogenised Milk 1L", sku: "MLK-1L", category: "Dairy", costPrice: 62, sellingPrice: 72, stock: 40, unit: "carton" },
    { name: "Parle-G Gold Biscuits (Pack of 6)", sku: "PAR-GLD", category: "Snacks", costPrice: 50, sellingPrice: 60, stock: 85, unit: "pack" },
    { name: "Dettol Original Soap 125g (Buy 3 Get 1)", sku: "DET-125G", category: "Personal Care", costPrice: 135, sellingPrice: 165, stock: 35, unit: "pack" },
    { name: "Colgate Strong Teeth 200g", sku: "COL-200G", category: "Personal Care", costPrice: 105, sellingPrice: 130, stock: 55, unit: "pcs" },
    { name: "Surf Excel Easy Wash Detergent 1kg", sku: "SRF-1KG", category: "Cleaning", costPrice: 125, sellingPrice: 150, stock: 40, unit: "pack" },
    { name: "Classmate Notebook Spiral A4", sku: "NOTE-A4", category: "Stationery", costPrice: 70, sellingPrice: 95, stock: 65, unit: "pcs" },
    { name: "Cello Gripper Ball Pen Blue (Pack of 5)", sku: "PEN-CL5", category: "Stationery", costPrice: 40, sellingPrice: 50, stock: 90, unit: "pack" },
  ];

  const createdProducts: Record<string, string> = {};
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { userId, sku: p.sku } });
    if (!existing) {
      const prod = await prisma.product.create({
        data: {
          userId,
          ...p,
        },
      });
      createdProducts[prod.name] = prod.id;
    } else {
      createdProducts[existing.name] = existing.id;
    }
  }

  // 4. Customers
  const customers = [
    { name: "Rajesh Kumar Sharma", phone: "9823011223", address: "Flat 402, Green Valley Apts", notes: "Regular customer, monthly Khata" },
    { name: "Priya Sundaram", phone: "9845199887", address: "House #12, 3rd Cross, Malleshwaram", notes: "Prefers UPI payments" },
    { name: "Amitabh Verma", phone: "9711044556", address: "Verma Clinic, Main Road", notes: "Doctor nearby, purchases sanitizers & stationery" },
    { name: "Sunita Deshmukh", phone: "9920133445", address: "B-10, Railway Colony", notes: "Weekly credit customer" },
    { name: "Vikram Malhotra", phone: "9811223344", address: "Shop 7, City Arcade", notes: "Wholesale tea customer" },
  ];

  const createdCustomers: Record<string, string> = {};
  for (const c of customers) {
    const existing = await prisma.customer.findFirst({ where: { userId, phone: c.phone } });
    if (!existing) {
      const cust = await prisma.customer.create({
        data: {
          userId,
          ...c,
        },
      });
      createdCustomers[cust.name] = cust.id;
    } else {
      createdCustomers[existing.name] = existing.id;
    }
  }

  // 5. Invoices & Sales across Days (Day 0, 1, 2, 3, 5, 7, 10, 14)
  const daysOffsets = [0, 1, 2, 3, 5, 7, 10, 14];

  for (const offset of daysOffsets) {
    const { date, dateString } = getDayInfo(offset);

    const existingCount = await prisma.invoice.count({
      where: { userId, dateString },
    });

    if (existingCount === 0) {
      // Bill 1: General Counter Sale (CASH)
      const b1InvNum = `INV-${date.getFullYear()}-D${offset}1`;
      await prisma.invoice.create({
        data: {
          userId,
          invoiceNumber: b1InvNum,
          date,
          dateString,
          customerName: "Walk-in Customer",
          subtotal: 1040,
          discount: 40,
          tax: 50,
          total: 1050,
          paidAmount: 1050,
          dueAmount: 0,
          paymentStatus: "PAID",
          paymentMethod: "CASH",
          items: {
            create: [
              { productName: "Basmati Rice Premium 5kg", quantity: 1, unitPrice: 460, total: 460 },
              { productName: "Fortune Sunflower Oil 1L", quantity: 2, unitPrice: 155, total: 310 },
              { productName: "Tata Gold Tea Leaves 500g", quantity: 1, unitPrice: 260, total: 260 },
            ],
          },
          payments: {
            create: {
              userId,
              amount: 1050,
              paymentMethod: "CASH",
              dateString,
              paymentDate: date,
              notes: "Counter Cash Checkout",
            },
          },
        },
      });

      // Bill 2: Customer Sale (UPI)
      const b2InvNum = `INV-${date.getFullYear()}-D${offset}2`;
      await prisma.invoice.create({
        data: {
          userId,
          invoiceNumber: b2InvNum,
          date,
          dateString,
          customerId: createdCustomers["Priya Sundaram"],
          customerName: "Priya Sundaram",
          customerPhone: "9845199887",
          subtotal: 650,
          discount: 20,
          tax: 31.5,
          total: 661.5,
          paidAmount: 661.5,
          dueAmount: 0,
          paymentStatus: "PAID",
          paymentMethod: "UPI",
          items: {
            create: [
              { productName: "Aashirvaad Shudh Chakki Atta 10kg", quantity: 1, unitPrice: 420, total: 420 },
              { productName: "Madhur Pure & Hygienic Sugar 1kg", quantity: 2, unitPrice: 50, total: 100 },
              { productName: "Colgate Strong Teeth 200g", quantity: 1, unitPrice: 130, total: 130 },
            ],
          },
          payments: {
            create: {
              userId,
              customerId: createdCustomers["Priya Sundaram"],
              amount: 661.5,
              paymentMethod: "UPI",
              dateString,
              paymentDate: date,
              notes: "Google Pay QR payment",
            },
          },
        },
      });

      // Bill 3: Khata Partial / Due Sale on selected days
      if (offset % 2 === 0) {
        const b3InvNum = `INV-${date.getFullYear()}-D${offset}3`;
        await prisma.invoice.create({
          data: {
            userId,
            invoiceNumber: b3InvNum,
            date,
            dateString,
            customerId: createdCustomers["Rajesh Kumar Sharma"],
            customerName: "Rajesh Kumar Sharma",
            customerPhone: "9823011223",
            subtotal: 1220,
            discount: 20,
            tax: 60,
            total: 1260,
            paidAmount: 260,
            dueAmount: 1000,
            paymentStatus: "PARTIAL",
            paymentMethod: "CREDIT",
            notes: `Paid ₹260 cash, ₹1000 balance added to monthly Khata`,
            items: {
              create: [
                { productName: "Surf Excel Easy Wash Detergent 1kg", quantity: 2, unitPrice: 150, total: 300 },
                { productName: "Dettol Original Soap 125g (Buy 3 Get 1)", quantity: 2, unitPrice: 165, total: 330 },
                { productName: "Basmati Rice Premium 5kg", quantity: 1, unitPrice: 460, total: 460 },
                { productName: "Classmate Notebook Spiral A4", quantity: 1, unitPrice: 95, total: 95 },
              ],
            },
            payments: {
              create: {
                userId,
                customerId: createdCustomers["Rajesh Kumar Sharma"],
                amount: 260,
                paymentMethod: "CASH",
                dateString,
                paymentDate: date,
                notes: "Cash advance payment",
              },
            },
          },
        });
      }

      // Past Day Expenses
      await prisma.expense.createMany({
        data: [
          {
            userId,
            title: `Daily Tea & Snacks for Shop Staff`,
            category: "Tea & Refreshments",
            amount: 80,
            paymentMethod: "CASH",
            date,
            dateString,
            reference: `Voucher #T${offset}`,
            notes: "Local tea vendor",
          },
          {
            userId,
            title: `Shop Maintenance & Cleaning`,
            category: "Repairs & Maintenance",
            amount: 120,
            paymentMethod: "CASH",
            date,
            dateString,
            reference: "Cash Memo",
            notes: "Cleaning materials",
          },
        ],
      });

      // Past Day Other Income
      if (offset === 0 || offset === 3 || offset === 7) {
        await prisma.otherIncome.create({
          data: {
            userId,
            title: "Empty Packing Boxes Scrap Sale",
            source: "Scrap & Waste Sale",
            amount: 280,
            paymentMethod: "CASH",
            date,
            dateString,
            notes: "28kg corrugated cardboard sold",
          },
        });
      }

      // Past Daybook Register entry
      const cashIn = 1050 + (offset % 2 === 0 ? 260 : 0) + (offset === 0 || offset === 3 || offset === 7 ? 280 : 0);
      const cashOut = 80 + 120; // 200
      const openCash = 2000;
      const expCash = openCash + cashIn - cashOut;

      await prisma.daybookRegister.upsert({
        where: {
          userId_dateString: {
            userId,
            dateString,
          },
        },
        update: {},
        create: {
          userId,
          dateString,
          openingCash: openCash,
          cashInflow: cashIn,
          cashOutflow: cashOut,
          expectedCash: expCash,
          actualCash: expCash,
          difference: 0,
          notes: offset === 0 ? "Drawer balanced for today" : `Daybook closed and verified for ${dateString}`,
          isClosed: offset !== 0,
        },
      });
    }
  }

  console.log("Seeding completed successfully! Login with demo@smartbazaar.local / smart123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
