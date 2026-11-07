"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  ShoppingBag,
  ArrowDownCircle,
  FileSpreadsheet,
} from "lucide-react";
import { getReports, getBusinessProfile } from "@/lib/actions";

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Module-level in-memory cache for instant 0ms tab switching
const cachedReportsMap: Record<string, { data: any; profile: any }> = {};

export default function ReportsPage() {
  const todayStr = formatDate(new Date());
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const initialCache = cachedReportsMap[`${todayStr}_${todayStr}`];
  const [data, setData] = useState<any>(() => initialCache?.data || null);
  const [profile, setProfile] = useState<any>(() => initialCache?.profile || { currency: "₹", name: "SmartBazaar Local Mart" });
  const [loading, setLoading] = useState(!initialCache);

  const currency = profile.currency || "₹";

  const loadData = async (s: string, e: string, silent = false) => {
    const key = `${s}_${e}`;
    const hasCache = Boolean(cachedReportsMap[key]);
    if (!silent && !hasCache) setLoading(true);
    try {
      const [rep, prof] = await Promise.all([
        getReports(s, e),
        getBusinessProfile(),
      ]);
      setData(rep);
      setProfile(prof);
      cachedReportsMap[key] = { data: rep, profile: prof };
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const key = `${startDate}_${endDate}`;
    loadData(startDate, endDate, Boolean(cachedReportsMap[key]));
  }, [startDate, endDate]);

  const setPresetRange = (preset: "today" | "7days" | "month" | "year") => {
    const today = new Date();
    const e = formatDate(today);
    let s = e;

    if (preset === "today") {
      s = e;
    } else if (preset === "7days") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      s = formatDate(d);
    } else if (preset === "month") {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      s = formatDate(d);
    } else if (preset === "year") {
      const d = new Date(today.getFullYear(), 0, 1);
      s = formatDate(d);
    }

    setStartDate(s);
    setEndDate(e);
  };

  const handleExportCSV = () => {
    if (!data) return;

    const rows = [
      ["BUSINESS FINANCIAL REPORT", profile.name],
      ["Period", `${startDate} to ${endDate}`],
      [],
      ["PROFIT & LOSS STATEMENT", ""],
      ["Total Sales Revenue", data.totalSales],
      ["Other Business Income", data.totalOtherIncome],
      ["Total Gross Revenue", data.totalRevenue],
      ["Cost of Goods Sold (COGS)", data.cogs],
      ["Gross Profit", data.grossProfit],
      ["Total Operating Expenses", data.totalExpenses],
      ["Net Profit / (Loss)", data.netProfit],
      ["Net Profit Margin (%)", `${data.profitMarginPercent}%`],
      [],
      ["EXPENSE BREAKDOWN BY CATEGORY", ""],
      ...data.expenseCategories.map((c: any) => [c.name, c.value]),
      [],
      ["PAYMENT METHOD DISTRIBUTION", ""],
      ...data.paymentMethods.map((p: any) => [p.name, p.value]),
      [],
      ["TOP SELLING PRODUCTS", ""],
      ["Product Name", "Quantity Sold", "Revenue Generated"],
      ...data.topProducts.map((p: any) => [p.name, p.quantity, p.revenue]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Financial_Report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>Reports & Financial Management</span>
          </h2>
          <p className="text-slate-500 text-xs">
            Analyze profit & loss, operating expenses, payment collections, and top products.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setPresetRange("today")}
              className={`px-3 py-1.5 rounded-lg transition ${
                startDate === endDate && startDate === todayStr
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPresetRange("7days")}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition"
            >
              7 Days
            </button>
            <button
              onClick={() => setPresetRange("month")}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition"
            >
              This Month
            </button>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="font-semibold text-slate-700 bg-transparent focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="font-semibold text-slate-700 bg-transparent focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Computing financial reports...
        </div>
      ) : (
        <>
          {/* Executive Profit & Loss Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Profit & Loss Statement (P&L)</h3>
                <p className="text-xs text-slate-500">
                  Financial performance from {startDate} to {endDate} ({data.invoicesCount} bills generated)
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Net Profit Margin:</span>
                <span className={`ml-2 text-sm font-extrabold px-2.5 py-1 rounded-lg ${
                  data.netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {data.profitMarginPercent}%
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500">Total Sales Revenue</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {currency}{data.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                {data.totalOtherIncome > 0 && (
                  <div className="text-[11px] text-teal-700 mt-1">
                    +{currency}{data.totalOtherIncome} other revenue
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500">Estimated COGS</span>
                <div className="text-2xl font-extrabold text-slate-700 mt-1">
                  {currency}{data.cogs.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Wholesale cost of goods sold</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500">Operating Expenses</span>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">
                  {currency}{data.totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{data.expensesCount} expenses recorded</div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <span className="text-xs font-semibold text-slate-300">Net Business Profit</span>
                <div className={`text-2xl font-extrabold mt-1 ${
                  data.netProfit >= 0 ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {currency}{data.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Gross Revenue − COGS − Expenses
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Section: Category Expenses & Payment Modes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Expenses Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Expense Breakdown by Category</h3>
                <ArrowDownCircle className="w-4 h-4 text-rose-500" />
              </div>

              <div className="mt-4 space-y-3">
                {data.expenseCategories.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No expenses recorded in this period.
                  </div>
                ) : (
                  data.expenseCategories.map((c: any) => {
                    const percent =
                      data.totalExpenses > 0
                        ? ((c.value / data.totalExpenses) * 100).toFixed(1)
                        : "0";
                    return (
                      <div key={c.name} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-700">{c.name}</span>
                          <span className="font-bold text-slate-900">
                            {currency}{c.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Payment Modes Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Sales by Payment Mode</h3>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="mt-4 space-y-3">
                {data.paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No sales recorded in this period.
                  </div>
                ) : (
                  data.paymentMethods.map((p: any) => {
                    const percent =
                      data.totalSales > 0
                        ? ((p.value / data.totalSales) * 100).toFixed(1)
                        : "0";
                    return (
                      <div key={p.name} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-700 uppercase font-bold">{p.name}</span>
                          <span className="font-bold text-slate-900">
                            {currency}{p.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Top Selling Products</h3>
                <p className="text-xs text-slate-500">Ranked by revenue generated in selected date range</p>
              </div>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Rank</th>
                    <th className="py-3 px-4 font-semibold">Product Description</th>
                    <th className="py-3 px-4 font-semibold text-center">Quantity Sold</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400">
                        No product sales recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    data.topProducts.map((p: any, idx: number) => (
                      <tr key={p.name} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {p.quantity} units
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                          {currency}{p.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

