import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getTodayString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split("T")[0];
}

async function main() {
  console.log("Seeding database...");

  // 1. Business Profile
  await prisma.businessProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "SmartBazaar Local Mart",
      tagline: "Your Trusted Neighborhood Store & Daily Needs",
      phone: "+91 98765 43210",
      email: "contact@smartbazaar.local",
      address: "Shop #14, Sunrise Plaza, MG Road, City Center",
      taxId: "GSTIN: 27AABCS1429B1Z8",
      currency: "₹",
      taxRate: 5.0,
      receiptFooter: "Thank you for shopping with us! Fresh groceries every day.",
    },
  });

  // 2. Products
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
    const existing = await prisma.product.findFirst({ where: { sku: p.sku } });
    if (!existing) {
      const prod = await prisma.product.create({ data: p });
      createdProducts[prod.name] = prod.id;
    } else {
      createdProducts[existing.name] = existing.id;
    }
  }

  // 3. Customers
  const customers = [
    { name: "Rajesh Kumar Sharma", phone: "9823011223", address: "Flat 402, Green Valley Apts", notes: "Regular customer, monthly Khata" },
    { name: "Priya Sundaram", phone: "9845199887", address: "House #12, 3rd Cross, Malleshwaram", notes: "Prefers UPI payments" },
    { name: "Amitabh Verma", phone: "9711044556", address: "Verma Clinic, Main Road", notes: "Doctor nearby, purchases sanitizers & stationery" },
    { name: "Sunita Deshmukh", phone: "9920133445", address: "B-10, Railway Colony", notes: "Weekly credit customer" },
  ];

  const createdCustomers: Record<string, string> = {};
  for (const c of customers) {
    const existing = await prisma.customer.findFirst({ where: { phone: c.phone } });
    if (!existing) {
      const cust = await prisma.customer.create({ data: c });
      createdCustomers[cust.name] = cust.id;
    } else {
      createdCustomers[existing.name] = existing.id;
    }
  }

  // 4. Invoices & Sales
  const today = getTodayString(0);
  const yesterday = getTodayString(1);
  const twoDaysAgo = getTodayString(2);

  const existingInvoices = await prisma.invoice.count();
  if (existingInvoices === 0) {
    // Bill 1 - Paid Cash Today
    const inv1 = await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-001",
        date: new Date(),
        dateString: today,
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
            amount: 1050,
            paymentMethod: "CASH",
            dateString: today,
            notes: "Counter Cash Sale",
          },
        },
      },
    });

    // Bill 2 - Paid UPI Today
    await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-002",
        date: new Date(),
        dateString: today,
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
            customerId: createdCustomers["Priya Sundaram"],
            amount: 661.5,
            paymentMethod: "UPI",
            dateString: today,
            notes: "Google Pay UPI payment",
          },
        },
      },
    });

    // Bill 3 - Credit / Due Bill Today for Rajesh Kumar (Khata)
    await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-003",
        date: new Date(),
        dateString: today,
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
        notes: "Paid ₹260 cash, remaining ₹1000 added to monthly Khata",
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
            customerId: createdCustomers["Rajesh Kumar Sharma"],
            amount: 260,
            paymentMethod: "CASH",
            dateString: today,
            notes: "Partial payment at counter",
          },
        },
      },
    });

    // Bill 4 - Yesterday's Bill
    await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-000",
        date: new Date(Date.now() - 86400000),
        dateString: yesterday,
        customerName: "Walk-in Customer",
        subtotal: 890,
        discount: 0,
        tax: 44.5,
        total: 934.5,
        paidAmount: 934.5,
        dueAmount: 0,
        paymentStatus: "PAID",
        paymentMethod: "CASH",
        items: {
          create: [
            { productName: "Aashirvaad Shudh Chakki Atta 10kg", quantity: 1, unitPrice: 420, total: 420 },
            { productName: "Fortune Sunflower Oil 1L", quantity: 2, unitPrice: 155, total: 310 },
            { productName: "Parle-G Gold Biscuits (Pack of 6)", quantity: 2, unitPrice: 60, total: 120 },
          ],
        },
        payments: {
          create: {
            amount: 934.5,
            paymentMethod: "CASH",
            dateString: yesterday,
            notes: "Cash counter sale",
          },
        },
      },
    });
  }

  // 5. Daily Expenses
  const existingExpenses = await prisma.expense.count();
  if (existingExpenses === 0) {
    await prisma.expense.createMany({
      data: [
        {
          title: "Daily Morning Tea & Snacks for Staff",
          category: "Tea & Refreshments",
          amount: 80,
          paymentMethod: "CASH",
          dateString: today,
          reference: "Voucher #T01",
          notes: "Chai stall monthly ledger payment",
        },
        {
          title: "Cleaning Supplies & Garbage Disposal",
          category: "Maintenance",
          amount: 150,
          paymentMethod: "CASH",
          dateString: today,
          reference: "Cash memo",
          notes: "Broom and disinfectant liquid",
        },
        {
          title: "Electricity Bill (Shop Counter)",
          category: "Utilities",
          amount: 1450,
          paymentMethod: "UPI",
          dateString: today,
          reference: "EB-OCT-2026",
          notes: "Paid via PhonePe QR",
        },
        {
          title: "Tempo Freight Charges for Stock Delivery",
          category: "Transportation",
          amount: 450,
          paymentMethod: "CASH",
          dateString: yesterday,
          reference: "LR-9921",
          notes: "Wholesale grain market delivery",
        },
        {
          title: "Wholesale Atta & Oil Restocking",
          category: "Inventory",
          amount: 6200,
          paymentMethod: "BANK",
          dateString: yesterday,
          reference: "PO-7781",
          notes: "Transferred to wholesale distributor",
        },
      ],
    });
  }

  // 6. Other Income
  const existingIncome = await prisma.otherIncome.count();
  if (existingIncome === 0) {
    await prisma.otherIncome.createMany({
      data: [
        {
          title: "Empty Packing Cardboard & Plastic Scrap Sale",
          source: "Scrap & Waste Sale",
          amount: 320,
          paymentMethod: "CASH",
          dateString: today,
          notes: "Sold 32kg corrugated boxes to raddiwala",
        },
        {
          title: "Courier Drop Point Handling Commission",
          source: "Commission",
          amount: 250,
          paymentMethod: "UPI",
          dateString: today,
          notes: "Weekly parcel dispatch commission",
        },
      ],
    });
  }

  // 7. Daybook for Today
  await prisma.daybookRegister.upsert({
    where: { dateString: today },
    update: {},
    create: {
      dateString: today,
      openingCash: 2500,
      cashInflow: 1050 + 260 + 320, // Inv1 cash (1050) + Inv3 cash (260) + scrap cash (320) = 1630
      cashOutflow: 80 + 150,        // Tea (80) + Cleaning (150) = 230
      expectedCash: 2500 + 1630 - 230, // 3900
      actualCash: 3900,
      difference: 0,
      notes: "Drawer balanced cleanly at afternoon check",
      isClosed: false,
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

