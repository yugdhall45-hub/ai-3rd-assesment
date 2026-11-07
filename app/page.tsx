"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building2,
  Landmark,
  Package,
  History,
  AlertTriangle,
  ArrowRightLeft,
  Users,
} from "lucide-react";
import {
  getBusinessProfile,
  getDaybook,
  getTotalCustomerDues,
  getSuppliers,
  getBankAccounts,
  getInventoryValuation,
} from "@/lib/actions";

interface DashboardData {
  profile: any;
  daybookData: any;
  totalCustomerDues: number;
  totalCreditorsDue: number;
  totalBankBalance: number;
  inventoryValuation: any;
  invoices: any[];
  expenses: any[];
}

const defaultDashboardData: DashboardData = {
  profile: { name: "SmartBazaar Local Mart", currency: "₹" },
  daybookData: {
    metrics: {
      totalSalesAllModes: 0,
      totalExpensesAllModes: 0,
      netDailyProfit: 0,
      expectedCash: 0,
      totalCashIn: 0,
      totalCashOut: 0,
    },
    register: { isClosed: false },
  },
  totalCustomerDues: 0,
  totalCreditorsDue: 0,
  totalBankBalance: 0,
  inventoryValuation: {
    totalProducts: 0,
    totalStockCount: 0,
    totalCostValue: 0,
    totalRetailValue: 0,
    potentialGrossProfit: 0,
    lowStockCount: 0,
  },
  invoices: [],
  expenses: [],
};

let cachedDashboardData: DashboardData = defaultDashboardData;
let hasInitialLoaded = false;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(cachedDashboardData);
  const [isRefreshing, setIsRefreshing] = useState(!hasInitialLoaded);

  const loadData = async (silent = false) => {
    setIsRefreshing(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const [
        profile,
        daybookData,
        totalCustomerDues,
        suppliers,
        bankAccounts,
        inventoryValuation,
      ] = await Promise.all([
        getBusinessProfile(),
        getDaybook(today),
        getTotalCustomerDues(),
        getSuppliers(),
        getBankAccounts(),
        getInventoryValuation(),
      ]);

      const totalCreditorsDue = suppliers.reduce(
        (sum, s) => sum + (s.currentBalance || 0),
        0
      );
      const totalBankBalance = bankAccounts.reduce(
        (sum, b) => sum + (b.balance || 0),
        0
      );

      const fresh: DashboardData = {
        profile,
        daybookData,
        totalCustomerDues,
        totalCreditorsDue,
        totalBankBalance,
        inventoryValuation,
        invoices: daybookData.invoices || [],
        expenses: daybookData.expenses || [],
      };

      cachedDashboardData = fresh;
      hasInitialLoaded = true;
      setData(fresh);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(hasInitialLoaded);

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setData((prev: any) =>
          prev ? { ...prev, profile: { ...prev.profile, ...e.detail } } : prev
        );
        cachedDashboardData.profile = {
          ...cachedDashboardData.profile,
          ...e.detail,
        };
      }
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  const profile = data.profile || { name: "SmartBazaar Local Mart", currency: "₹" };
  const currency = profile.currency || "₹";
  const daybookData = data.daybookData || defaultDashboardData.daybookData;
  const totalCustomerDues = data.totalCustomerDues || 0;
  const totalCreditorsDue = data.totalCreditorsDue || 0;
  const totalBankBalance = data.totalBankBalance || 0;
  const inventoryValuation = data.inventoryValuation || defaultDashboardData.inventoryValuation;
  const invoices = data.invoices || [];
  const expenses = data.expenses || [];

  const todaySales = daybookData.metrics?.totalSalesAllModes || 0;
  const todayExpenses = daybookData.metrics?.totalExpensesAllModes || 0;
  const todayNetProfit = daybookData.metrics?.netDailyProfit || 0;
  const expectedCashInDrawer = daybookData.metrics?.expectedCash || 0;
  const totalLiquidFunds = expectedCashInDrawer + totalBankBalance;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Smart Business Management ERP
            </span>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">{profile.name}</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Real-time control over sales, inventory, cash in galla, bank balance, debtors & creditors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
            />
          </button>

          <Link
            href="/purchases"
            prefetch={true}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/10 transition"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>+ Purchase</span>
          </Link>

          <Link
            href="/billing"
            prefetch={true}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Receipt className="w-4 h-4 stroke-[2.5]" />
            <span>+ POS BILL</span>
          </Link>
        </div>
      </div>

      {/* Action Alerts Banner */}
      {inventoryValuation.lowStockCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                Low Stock Alert: {inventoryValuation.lowStockCount} items running low
              </h4>
              <p className="text-[11px] text-amber-800/80">
                Replenish inventory from your suppliers to avoid stockouts at checkout.
              </p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition"
          >
            View Stock
          </Link>
        </div>
      )}

      {/* Primary KPI Row 1: Today's Operations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {currency}
              {todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="font-bold text-emerald-600">{invoices.length} bills</span> created today
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Today's Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {currency}
              {todayExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="font-bold text-rose-600">{expenses.length} overheads</span> recorded
            </div>
          </div>
        </div>

        {/* Today's Net Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Net Profit Today
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                todayNetProfit >= 0 ? "bg-teal-50 text-teal-600" : "bg-amber-50 text-amber-600"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black tracking-tight ${
                todayNetProfit >= 0 ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {currency}
              {todayNetProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Daily Bikri − Daily Lagat
            </div>
          </div>
        </div>

        {/* Galla Cash in Hand */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Galla Cash in Hand
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {currency}
              {expectedCashInDrawer.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Register Drawer physical cash
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPI Row 2: Balances & Ledger Position */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Receivables (Debtors / Khata) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-800 uppercase tracking-wide">
              Debtors Khata (Lena Hai)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              {currency}
              {totalCustomerDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-amber-800/80 mt-1 font-semibold">
              Pending customer receivables
            </div>
          </div>
        </div>

        {/* Payables (Creditors / Suppliers) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-800 uppercase tracking-wide">
              Creditors (Dena Hai)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-700 tracking-tight">
              {currency}
              {totalCreditorsDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-rose-800/80 mt-1 font-semibold">
              Payables owed to wholesale suppliers
            </div>
          </div>
        </div>

        {/* Bank & UPI Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Bank & UPI Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {currency}
              {totalBankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Digital bank account balances
            </div>
          </div>
        </div>

        {/* Total Stock Valuation */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Inventory Value (Maal)
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {currency}
              {inventoryValuation.totalCostValue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {inventoryValuation.totalProducts} items in warehouse/shop
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix for Shopkeeper */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <Link
          href="/billing"
          className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex flex-col items-center justify-center text-center transition active:scale-95 shadow-xs"
        >
          <Receipt className="w-5 h-5 text-emerald-400 mb-1.5" />
          <span className="text-xs font-black">+ Naya Bill (POS)</span>
        </Link>

        <Link
          href="/purchases"
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-2xl flex flex-col items-center justify-center text-center transition active:scale-95 shadow-xs"
        >
          <ShoppingBag className="w-5 h-5 text-emerald-600 mb-1.5" />
          <span className="text-xs font-bold">Kharidari (Purchases)</span>
        </Link>

        <Link
          href="/customers"
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-2xl flex flex-col items-center justify-center text-center transition active:scale-95 shadow-xs"
        >
          <Users className="w-5 h-5 text-amber-600 mb-1.5" />
          <span className="text-xs font-bold">Grahak Khata (Udhar)</span>
        </Link>

        <Link
          href="/creditors"
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-2xl flex flex-col items-center justify-center text-center transition active:scale-95 shadow-xs"
        >
          <Building2 className="w-5 h-5 text-rose-600 mb-1.5" />
          <span className="text-xs font-bold">Suppliers (Lendari)</span>
        </Link>

        <Link
          href="/bank"
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-2xl flex flex-col items-center justify-center text-center transition active:scale-95 shadow-xs"
        >
          <Landmark className="w-5 h-5 text-teal-600 mb-1.5" />
          <span className="text-xs font-bold">Bank & UPI</span>
        </Link>

        <Link
          href="/daybook"
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-2xl flex flex-col items-center justify-center text-center transition active:scale-95 shadow-xs"
        >
          <Wallet className="w-5 h-5 text-blue-600 mb-1.5" />
          <span className="text-xs font-bold">Galla & Daybook</span>
        </Link>
      </div>

      {/* Main Content Two Columns: Today's Invoices vs Today's Expenses & Cash Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Invoices */}
        <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Today's Invoices & Sales</h3>
              <p className="text-xs text-slate-500">Live feed of completed customer transactions</p>
            </div>
            <Link
              href="/billing"
              prefetch={true}
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
                  prefetch={true}
                  className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline"
                >
                  Create first bill now
                </Link>
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      #{inv.invoiceNumber.split("-").pop()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {inv.customerName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{inv.items?.length || 0} items</span>
                        <span>•</span>
                        <span className="uppercase text-[11px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {inv.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-slate-900 text-sm sm:text-base">
                      {currency}
                      {inv.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-0.5">
                      {inv.paymentStatus === "PAID" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                        </span>
                      )}
                      {inv.paymentStatus === "PARTIAL" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Due: {currency}
                          {inv.dueAmount}
                        </span>
                      )}
                      {inv.paymentStatus === "DUE" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
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

        {/* Right Column (1 Col): Today's Expenses & Daybook Cash Pulse */}
        <div className="space-y-6">
          {/* Expenses Mini Feed */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Today's Expenses</h3>
                <p className="text-xs text-slate-500">Recorded overheads</p>
              </div>
              <Link
                href="/expenses"
                prefetch={true}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
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
                      <div className="font-bold text-slate-800">{exp.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {exp.category} • {exp.paymentMethod}
                      </div>
                    </div>
                    <div className="font-black text-rose-600">
                      −{currency}
                      {exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Cash Reconciliation Box */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                Galla Cash Reconciliation
              </span>
              <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                {daybookData.register?.isClosed ? "Day Closed" : "Open Day"}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight">
                {currency}
                {expectedCashInDrawer.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-emerald-100 text-xs mt-1">
                Expected physical cash currently in your shop drawer.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-emerald-500/50 flex items-center justify-between">
              <span className="text-xs text-emerald-100 font-semibold">Daily Cash In:</span>
              <span className="text-xs font-bold">
                +{currency}
                {daybookData.metrics?.totalCashIn?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                }) || "0.00"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-emerald-100 font-semibold">Daily Cash Out:</span>
              <span className="text-xs font-bold text-rose-200">
                −{currency}
                {daybookData.metrics?.totalCashOut?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                }) || "0.00"}
              </span>
            </div>

            <Link
              href="/daybook"
              prefetch={true}
              className="mt-5 w-full bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs py-2.5 rounded-xl block text-center transition shadow-xs"
            >
              Reconcile & Close Daybook
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
