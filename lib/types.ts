export interface BusinessProfile {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  currency: string;
  receiptFooter: string;
  taxRate: number;
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface CustomerData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  totalDues?: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dateString: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "PAID" | "PARTIAL" | "DUE";
  paymentMethod: "CASH" | "UPI" | "CARD" | "CREDIT";
  notes: string | null;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface ExpenseData {
  id: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  date: string;
  dateString: string;
  reference: string | null;
  notes: string | null;
}

export interface OtherIncomeData {
  id: string;
  title: string;
  source: string;
  amount: number;
  paymentMethod: string;
  date: string;
  dateString: string;
  notes: string | null;
}

export interface DaybookSummary {
  dateString: string;
  openingCash: number;
  cashSales: number;
  otherCashIncome: number;
  creditPaymentsCollected: number;
  totalCashIn: number;
  cashExpenses: number;
  totalCashOut: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
  isClosed: boolean;
  notes: string | null;
  events: DaybookEvent[];
}

export interface DaybookEvent {
  id: string;
  type: "INVOICE" | "EXPENSE" | "OTHER_INCOME" | "CUSTOMER_PAYMENT";
  title: string;
  subtitle: string;
  amount: number;
  isIncome: boolean;
  paymentMethod: string;
  time: string;
  raw?: any;
}

