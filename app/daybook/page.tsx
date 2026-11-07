"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Receipt,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { getDaybook, saveDaybookRegister, getBusinessProfile } from "@/lib/actions";

// Module-level in-memory cache for instant 0ms tab switching
const cachedDaybookMap: Record<string, { dayData: any; profile: any }> = {};

export default function DaybookPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const initialCache = cachedDaybookMap[new Date().toISOString().split("T")[0]];
  const [dayData, setDayData] = useState<any>(() => initialCache?.dayData || null);
  const [profile, setProfile] = useState<any>(
    () => initialCache?.profile || { currency: "₹", name: "SmartBazaar Local Mart" }
  );
  const [loading, setLoading] = useState(!initialCache);

  // Reconciliation drawer inputs
  const [openingCashInput, setOpeningCashInput] = useState<string>(
    () => String(initialCache?.dayData?.register?.openingCash || 0)
  );
  const [actualCashInput, setActualCashInput] = useState<string>(
    () => (initialCache?.dayData?.register?.actualCash != null ? String(initialCache.dayData.register.actualCash) : "")
  );
  const [notesInput, setNotesInput] = useState<string>(
    () => initialCache?.dayData?.register?.notes || ""
  );
  const [saving, setSaving] = useState(false);

  const currency = profile.currency || "₹";

  const fetchDay = async (dateStr: string, silent = false) => {
    const hasCache = Boolean(cachedDaybookMap[dateStr]);
    if (!silent && !hasCache) setLoading(true);
    try {
      const [res, prof] = await Promise.all([
        getDaybook(dateStr),
        getBusinessProfile(),
      ]);
      setDayData(res);
      setProfile(prof);
      cachedDaybookMap[dateStr] = { dayData: res, profile: prof };

      // sync inputs
      setOpeningCashInput(String(res.register.openingCash || 0));
      setActualCashInput(
        res.register.actualCash !== null && res.register.actualCash !== undefined
          ? String(res.register.actualCash)
          : ""
      );
      setNotesInput(res.register.notes || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDay(selectedDate, Boolean(cachedDaybookMap[selectedDate]));
  }, [selectedDate]);

  const changeDateByDays = (days: number) => {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleSaveRegister = async (closeDay = false) => {
    setSaving(true);
    try {
      const actual = actualCashInput !== "" ? parseFloat(actualCashInput) : undefined;
      await saveDaybookRegister({
        dateString: selectedDate,
        openingCash: parseFloat(openingCashInput) || 0,
        actualCash: actual,
        notes: notesInput,
        isClosed: closeDay ? true : dayData?.register?.isClosed || false,
      });
      await fetchDay(selectedDate);
      alert(closeDay ? "Day successfully reconciled and locked!" : "Daybook saved successfully.");
    } catch (err) {
      alert("Error saving daybook register");
    } finally {
      setSaving(false);
    }
  };

  // Export Daybook to CSV
  const handleExportCSV = () => {
    if (!dayData) return;
    const rows = [
      ["Date", selectedDate],
      ["Opening Cash", dayData.metrics.openingCash],
      ["Cash Sales & Inflow", dayData.metrics.totalCashIn],
      ["Cash Outflow (Expenses)", dayData.metrics.totalCashOut],
      ["Expected Cash in Drawer", dayData.metrics.expectedCash],
      ["Actual Cash Counted", dayData.register.actualCash || "Not Counted"],
      ["Difference", dayData.register.difference || "0"],
      [],
      ["TIME", "TYPE", "TITLE", "SUBTITLE", "PAYMENT MODE", "AMOUNT"],
      ...dayData.events.map((e: any) => [
        e.time,
        e.type,
        `"${e.title}"`,
        `"${e.subtitle}"`,
        e.paymentMethod,
        `${e.isIncome ? "+" : "-"}${e.amount}`,
      ]),
    ];

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Daybook_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const expectedCash = dayData ? dayData.metrics.expectedCash : 0;
  const countedCash = actualCashInput !== "" ? parseFloat(actualCashInput) : null;
  const cashDifference = countedCash !== null ? countedCash - expectedCash : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Date Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <span>Daily Business Daybook & Cash Register</span>
          </h2>
          <p className="text-slate-500 text-xs">
            Complete daily audit trail, cash drawer balance, and chronological activity ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition"
          >
            Today
          </button>

          <button
            onClick={() => changeDateByDays(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading daybook records...
        </div>
      ) : (
        <>
          {/* Day Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Total Daily Sales (All)</span>
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">
                {currency}{dayData?.metrics.totalSalesAllModes.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Cash, UPI, Card & Credit</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Total Daily Expenses</span>
                <ArrowDownCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-rose-600">
                {currency}{dayData?.metrics.totalExpensesAllModes.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Shop overheads & purchases</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Net Daily Profit</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className={`mt-2 text-2xl font-extrabold ${
                dayData?.metrics.netDailyProfit >= 0 ? "text-emerald-700" : "text-amber-700"
              }`}>
                {currency}{dayData?.metrics.netDailyProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Gross Day Inflows − Outflows</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Register Status</span>
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                {dayData?.register.isClosed ? (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Day Closed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Open for Billing
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Audit status for {selectedDate}</div>
            </div>
          </div>

          {/* Cash Drawer Reconciliation Box & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Reconciliation Drawer (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Cash Counter Reconciliation</h3>
                  <p className="text-xs text-slate-500">Physical drawer cash balance check</p>
                </div>
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>

              {/* Cash formula breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Opening Cash in Drawer:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{currency}</span>
                    <input
                      type="number"
                      value={openingCashInput}
                      onChange={(e) => setOpeningCashInput(e.target.value)}
                      className="w-24 px-2 py-0.5 bg-white border border-slate-300 rounded text-right font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>+ Cash Received (Bills & Khata):</span>
                  <span>+{currency}{dayData?.metrics.totalCashIn.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>− Cash Expenses Paid:</span>
                  <span>−{currency}{dayData?.metrics.totalCashOut.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Expected Drawer Cash:</span>
                  <span className="text-blue-700">{currency}{expectedCash.toFixed(2)}</span>
                </div>
              </div>

              {/* Physical count entry */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Actual Physical Cash Counted in Drawer ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter physical cash amount counted"
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {countedCash !== null && (
                  <div className="mt-2 p-3 rounded-xl border text-xs">
                    {cashDifference === 0 ? (
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2 rounded-lg font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Exact Match! Zero difference in cash register.</span>
                      </div>
                    ) : cashDifference! < 0 ? (
                      <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-2 rounded-lg font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Shortage: Drawer has {currency}{Math.abs(cashDifference!).toFixed(2)} less than expected!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-teal-700 bg-teal-50 p-2 rounded-lg font-bold">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>Excess: Drawer has {currency}{cashDifference!.toFixed(2)} surplus cash!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Day Closing Notes
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Afternoon shift cash handed over to owner..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveRegister(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
                >
                  Save Daybook
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveRegister(true)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock & Close Day</span>
                </button>
              </div>
            </div>

            {/* Chronological Daily Activity Stream (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Daily Transaction Ledger ({dayData?.events.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological activity stream for {selectedDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Event Stream */}
              <div className="flex-1 p-4 divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                {dayData?.events.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No transactions recorded on {selectedDate}.
                  </div>
                ) : (
                  dayData.events.map((evt: any) => (
                    <div key={evt.id} className="py-3.5 flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          evt.isIncome
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}>
                          {evt.isIncome ? (
                            <ArrowUpCircle className="w-4 h-4" />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="font-semibold text-slate-900">{evt.title}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {evt.subtitle}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-slate-500">
                              {evt.time}
                            </span>
                            <span className="text-[10px] uppercase font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {evt.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold text-sm ${
                          evt.isIncome ? "text-emerald-700" : "text-rose-600"
                        }`}>
                          {evt.isIncome ? "+" : "−"}{currency}{evt.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        {evt.paidAmount !== undefined && evt.amount !== evt.paidAmount && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            Paid: {currency}{evt.paidAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

