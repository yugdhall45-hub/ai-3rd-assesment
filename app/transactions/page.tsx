"use client";

import { useState, useEffect } from "react";
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Search,
  Calendar,
  ShieldCheck,
  Filter,
  FileSpreadsheet,
  FileText,
  User,
  CheckCircle,
  Tag,
} from "lucide-react";
import { getTransactions, getAuditLogs } from "@/lib/actions";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<"TRANSACTIONS" | "AUDIT">("TRANSACTIONS");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [txns, logs] = await Promise.all([
        getTransactions({
          type: typeFilter,
          category: categoryFilter,
          limit: 150,
        }),
        getAuditLogs(150),
      ]);
      setTransactions(txns);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, categoryFilter]);

  const filteredTransactions = transactions.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.txnNumber.toLowerCase().includes(q) ||
      (t.partyName && t.partyName.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      t.paymentMode.toLowerCase().includes(q)
    );
  });

  const filteredAuditLogs = auditLogs.filter((l) => {
    const q = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      (l.performedBy && l.performedBy.toLowerCase().includes(q))
    );
  });

  const totalIn = transactions
    .filter((t) => t.type === "MONEY_IN")
    .reduce((s, t) => s + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === "MONEY_OUT")
    .reduce((s, t) => s + t.amount, 0);

  const netCashFlow = totalIn - totalOut;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-600" />
            <span>Unified Transactions & Audit Log (Hisaab & Audit)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time feed of all cash inflows, outflows, supplier settlements, and immutable system audit logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200 rounded-xl">
          <button
            onClick={() => setActiveTab("TRANSACTIONS")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              activeTab === "TRANSACTIONS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-950"
            }`}
          >
            Money Movements
          </button>
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "AUDIT"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-950"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Only for Transactions Tab) */}
      {activeTab === "TRANSACTIONS" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                Total Money In (Aawak)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              +₹{totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-800/80 mt-1 font-semibold">
              Sales & debtor collections
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-rose-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-800 uppercase tracking-wide">
                Total Money Out (Jawak)
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
              −₹{totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-rose-700 mt-1 font-semibold">
              Expenses & supplier settlements
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                Net Cash Flow (Shuddh Bachat)
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold border border-slate-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`mt-3 text-2xl sm:text-3xl font-black tracking-tight ${
                netCashFlow >= 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              ₹{netCashFlow.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Money Inflow − Money Outflow
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "TRANSACTIONS"
                  ? "Search by Txn ID, party, description..."
                  : "Search audit logs by action, details..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {activeTab === "TRANSACTIONS" && (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Types</option>
                <option value="MONEY_IN">Money In (+)</option>
                <option value="MONEY_OUT">Money Out (−)</option>
                <option value="TRANSFER">Transfers (⇄)</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="SALE">Sales Bills</option>
                <option value="PURCHASE">Purchases</option>
                <option value="EXPENSE">Expenses</option>
                <option value="CUSTOMER_PAYMENT">Customer Khata</option>
                <option value="SUPPLIER_PAYMENT">Supplier Settle</option>
                <option value="BANK_TRANSFER">Bank Transfers</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Money Movements Table */}
        {activeTab === "TRANSACTIONS" && (
          <div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-semibold">
                Loading Transactions...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">No Transactions Found</div>
                <p className="text-xs text-slate-400">
                  Transactions appear automatically as you bill sales, record purchases, and pay expenses.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-slate-200 text-[11px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Txn # / Date</th>
                      <th className="py-3 px-4">Type / Category</th>
                      <th className="py-3 px-4">Party / Description</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/80 transition font-medium">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 font-mono">{txn.txnNumber}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{txn.dateString}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {txn.type === "MONEY_IN" ? (
                              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                                ↓
                              </span>
                            ) : txn.type === "MONEY_OUT" ? (
                              <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
                                ↑
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                                ⇄
                              </span>
                            )}
                            <span className="font-bold text-slate-800 text-xs">
                              {txn.category.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="font-bold text-slate-900">{txn.partyName || "Store Counter"}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-sm">
                            {txn.description || "—"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {txn.paymentMode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-sm sm:text-base">
                          <span
                            className={
                              txn.type === "MONEY_IN"
                                ? "text-emerald-600"
                                : txn.type === "MONEY_OUT"
                                ? "text-rose-600"
                                : "text-amber-600"
                            }
                          >
                            {txn.type === "MONEY_IN" ? "+" : txn.type === "MONEY_OUT" ? "−" : ""}
                            ₹{txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Immutable Audit Log Table */}
        {activeTab === "AUDIT" && (
          <div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-semibold">
                Loading Audit Trail...
              </div>
            ) : filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">No Audit Logs Recorded</div>
                <p className="text-xs text-slate-400">
                  Every bill creation, stock change, and payment settlement creates a permanent audit record.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-slate-200 text-[11px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Audit Details</th>
                      <th className="py-3 px-4">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition font-medium">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              log.action === "CREATE"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.action === "SETTLE"
                                ? "bg-teal-100 text-teal-800"
                                : log.action === "DELETE"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 text-xs">{log.entityType}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-mono text-xs">
                          {log.details}
                        </td>
                        <td className="py-3 px-4 text-slate-500 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.performedBy}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
