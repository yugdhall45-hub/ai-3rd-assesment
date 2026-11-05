"use client";

import { useState, useEffect } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  Tag,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getOtherIncomes,
  createOtherIncome,
  deleteOtherIncome,
  getBusinessProfile,
} from "@/lib/actions";

const EXPENSE_CATEGORIES = [
  "Tea & Refreshments",
  "Utilities & Electricity",
  "Rent",
  "Staff Wages & Salaries",
  "Inventory & Purchases",
  "Transportation & Freight",
  "Repairs & Maintenance",
  "Packaging & Bags",
  "Marketing & Printing",
  "Miscellaneous",
];

const INCOME_SOURCES = [
  "Scrap & Waste Sale",
  "Commission & Courier Drop",
  "Delivery Charges Collected",
  "Equipment / Asset Rent",
  "Consulting / Service Fee",
  "Miscellaneous Income",
];

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({ currency: "₹" });
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [source, setSource] = useState(INCOME_SOURCES[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [dateString, setDateString] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Filter State
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  const currency = profile.currency || "₹";

  const loadData = async () => {
    setLoading(true);
    try {
      const [exps, incs, prof] = await Promise.all([
        getExpenses(100),
        getOtherIncomes(100),
        getBusinessProfile(),
      ]);
      setExpenses(exps);
      setIncomes(incs);
      setProfile(prof);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    try {
      await createExpense({
        title: title.trim(),
        category,
        amount: val,
        paymentMethod,
        dateString,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setTitle("");
      setAmount("");
      setReference("");
      setNotes("");
      await loadData();
    } catch (err) {
      alert("Error logging expense");
    }
  };

  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    try {
      await createOtherIncome({
        title: title.trim(),
        source,
        amount: val,
        paymentMethod,
        dateString,
        notes: notes.trim() || undefined,
      });
      setTitle("");
      setAmount("");
      setNotes("");
      await loadData();
    } catch (err) {
      alert("Error logging income");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense entry?")) return;
    await deleteExpense(id);
    await loadData();
  };

  const handleDeleteIncome = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income entry?")) return;
    await deleteOtherIncome(id);
    await loadData();
  };

  // Calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayExpenses = expenses
    .filter((e) => e.dateString === todayStr)
    .reduce((s, e) => s + e.amount, 0);

  const todayCashExpenses = expenses
    .filter((e) => e.dateString === todayStr && e.paymentMethod === "CASH")
    .reduce((s, e) => s + e.amount, 0);

  const todayIncome = incomes
    .filter((i) => i.dateString === todayStr)
    .reduce((s, i) => s + i.amount, 0);

  // Filtered lists
  const filteredExpenses = expenses.filter((e) => {
    const matchDate = selectedDateFilter ? e.dateString === selectedDateFilter : true;
    const matchCat = selectedCategoryFilter ? e.category === selectedCategoryFilter : true;
    return matchDate && matchCat;
  });

  const filteredIncomes = incomes.filter((i) => {
    return selectedDateFilter ? i.dateString === selectedDateFilter : true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Expenses & Other Income
          </h2>
          <p className="text-slate-500 text-xs">
            Log day-to-day shop overheads, staff tea/snacks, utility bills, and non-billing revenue.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("expense")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "expense"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Daily Expenses ({expenses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "income"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Other Income ({incomes.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-rose-600 tracking-tight">
            {currency}{todayExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all payment modes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Cash Paid Out</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-amber-700 tracking-tight">
            {currency}{todayCashExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Deducted directly from drawer cash</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Other Income</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-teal-700 tracking-tight">
            {currency}{todayIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Scrap sale, commissions, etc.</div>
        </div>
      </div>

      {/* Main Grid: Entry Form (4 cols) + History Table (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-1">
            {activeTab === "expense" ? "Record New Expense" : "Record Other Income"}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Instant entry synced with today's daybook ledger.
          </p>

          <form
            onSubmit={activeTab === "expense" ? handleCreateExpense : handleCreateIncome}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeTab === "expense" ? "Expense Description *" : "Income Description *"}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeTab === "expense" ? "e.g. Staff Tea & Morning Samosas" : "e.g. Cardboard box scrap sale"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === "expense" ? "Category" : "Source"}
                </label>
                {activeTab === "expense" ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {INCOME_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CASH">Cash (Drawer)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={dateString}
                  onChange={(e) => setDateString(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {activeTab === "expense" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Voucher / Bill # (Optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Memo #4491 or LR-882"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for bookkeeping..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 ${
                activeTab === "expense"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{activeTab === "expense" ? "Save Expense Entry" : "Save Income Entry"}</span>
            </button>
          </form>
        </div>

        {/* Ledger Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
              </span>
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              />
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter("")}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                >
                  Clear Date
                </button>
              )}
            </div>

            {activeTab === "expense" && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            {activeTab === "expense" ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Title</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Mode</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No expense records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {exp.dateString}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{exp.title}</div>
                          {exp.reference && (
                            <div className="text-[11px] text-slate-400">Ref: {exp.reference}</div>
                          )}
                          {exp.notes && (
                            <div className="text-[11px] text-slate-400 italic">{exp.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            exp.paymentMethod === "CASH" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"
                          }`}>
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600 whitespace-nowrap">
                          −{currency}{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Title</th>
                    <th className="py-3 px-4 font-semibold">Source</th>
                    <th className="py-3 px-4 font-semibold">Mode</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No other income records found.
                      </td>
                    </tr>
                  ) : (
                    filteredIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {inc.dateString}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{inc.title}</div>
                          {inc.notes && (
                            <div className="text-[11px] text-slate-400 italic">{inc.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded text-[11px] font-medium">
                            {inc.source}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {inc.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-teal-700 whitespace-nowrap">
                          +{currency}{inc.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteIncome(inc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

