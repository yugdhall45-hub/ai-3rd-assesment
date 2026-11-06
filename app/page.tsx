import Link from "next/link";
import {
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getBusinessProfile, getInvoices, getExpenses, getOtherIncomes, getDaybook, getCustomers } from "@/lib/actions";

export const revalidate = 30; // Cache for 30 seconds

export default async function DashboardPage() {
  const profile = await getBusinessProfile();
  const currency = profile.currency;
  const today = new Date().toISOString().split("T")[0];

  const [invoices, expenses, otherIncomes, daybookData, customers] = await Promise.all([
    getInvoices(10, today),
    getExpenses(10, today),
    getOtherIncomes(10, today),
    getDaybook(today),
    getCustomers(),
  ]);

  // Today's calculations
  const todaySales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const todayOtherIncome = otherIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const todayTotalRevenue = todaySales + todayOtherIncome;
  const todayExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const todayNetProfit = todayTotalRevenue - todayExpenses;
  const totalCustomerDues = customers.reduce((sum, c) => sum + (c.totalDues || 0), 0);

  // Cash in drawer
  const expectedCashInDrawer = daybookData.metrics.expectedCash;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            Daily Business Dashboard
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">{profile.name}</h2>
          <p className="text-slate-300 text-sm mt-1">
            Track daily billing, cash flows, expenses, and daybook closing in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <Receipt className="w-4 h-4" />
            <span>Create Bill</span>
          </Link>
          <Link
            href="/daybook"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-white/10 transition"
          >
            <span>Daybook Register</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currency}{todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-medium text-emerald-600">{invoices.length} bills</span> created today
            </div>
          </div>
        </div>

        {/* Card 2: Today's Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currency}{todayExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-medium text-rose-600">{expenses.length} entries</span> recorded
            </div>
          </div>
        </div>

        {/* Card 3: Today's Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Net Profit Today</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              todayNetProfit >= 0 ? "bg-teal-50 text-teal-600" : "bg-amber-50 text-amber-600"
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold tracking-tight ${
              todayNetProfit >= 0 ? "text-emerald-700" : "text-amber-700"
            }`}>
              {currency}{todayNetProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Sales + Incomes − Expenses
            </div>
          </div>
        </div>

        {/* Card 4: Expected Cash in Drawer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cash in Drawer</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currency}{expectedCashInDrawer.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Opening cash + today's cash in
            </div>
          </div>
        </div>

        {/* Card 5: Khata Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Khata Dues</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-700 tracking-tight">
              {currency}{totalCustomerDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Pending credit across customers
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Two Columns: Today's Invoices vs Today's Expenses & Daybook */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Invoices */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Today's Invoices & Bills</h3>
              <p className="text-xs text-slate-500">Recent customer checkouts and transactions</p>
            </div>
            <Link
              href="/billing"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Go to POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Receipt className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-sm font-medium">No bills generated today yet.</p>
                <Link
                  href="/billing"
                  className="mt-3 inline-block text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Create first bill now
                </Link>
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      #{inv.invoiceNumber.split("-").pop()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {inv.customerName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{inv.items.length} items</span>
                        <span>•</span>
                        <span className="uppercase text-[11px] font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {inv.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">
                      {currency}{inv.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-0.5">
                      {inv.paymentStatus === "PAID" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                        </span>
                      )}
                      {inv.paymentStatus === "PARTIAL" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Due: {currency}{inv.dueAmount}
                        </span>
                      )}
                      {inv.paymentStatus === "DUE" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> Full Due
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Today's Expenses & Daybook Pulse */}
        <div className="space-y-6">
          {/* Expenses Mini Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Today's Expenses</h3>
                <p className="text-xs text-slate-500">Recorded overheads</p>
              </div>
              <Link
                href="/expenses"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                + Add
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {expenses.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No expenses recorded today.
                </div>
              ) : (
                expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{exp.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {exp.category} • {exp.paymentMethod}
                      </div>
                    </div>
                    <div className="font-bold text-rose-600">
                      −{currency}{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Cash Reconciliation Box */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-emerald-100 text-xs font-medium uppercase tracking-wider">
                Daybook Cash Status
              </span>
              <span className="bg-white/20 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                {daybookData.register.isClosed ? "Day Closed" : "Open Day"}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight">
                {currency}{expectedCashInDrawer.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-emerald-100 text-xs mt-1">
                Expected physical cash currently in your cash counter.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-emerald-500/50 flex items-center justify-between">
              <span className="text-xs text-emerald-100">Daily Cash In:</span>
              <span className="text-xs font-bold">
                +{currency}{daybookData.metrics.totalCashIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-emerald-100">Daily Cash Out:</span>
              <span className="text-xs font-bold text-rose-200">
                −{currency}{daybookData.metrics.totalCashOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <Link
              href="/daybook"
              className="mt-5 w-full bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-xs py-2.5 rounded-xl block text-center transition"
            >
              Reconcile & Close Day
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

