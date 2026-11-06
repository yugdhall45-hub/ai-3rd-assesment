import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all data...");
  await prisma.invoiceItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.otherIncome.deleteMany({});
  await prisma.daybookRegister.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.businessProfile.deleteMany({});
  console.log("✅ All dummy data deleted! Database is now clean.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

