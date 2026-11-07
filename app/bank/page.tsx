"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  QrCode,
  CheckCircle,
  Copy,
  Check,
  Building2,
  Trash2,
  X,
  Wallet,
} from "lucide-react";
import {
  getBankAccounts,
  createBankAccount,
  recordBankTransfer,
  deleteBankAccount,
  getDaybook,
} from "@/lib/actions";

export default function BankPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [todayDaybook, setTodayDaybook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);

  // New Account State
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [isPrimary, setIsPrimary] = useState(false);

  // Transfer State
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [direction, setDirection] = useState<"CASH_TO_BANK" | "BANK_TO_CASH">("CASH_TO_BANK");
  const [transferAmount, setTransferAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    try {
      const [accs, daybook] = await Promise.all([
        getBankAccounts(),
        getDaybook(),
      ]);
      setAccounts(accs);
      if (daybook?.metrics) {
        setTodayDaybook(daybook.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyUpi = (upi: string) => {
    navigator.clipboard.writeText(upi);
    setCopiedUpi(upi);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) return;
    setSubmitting(true);
    try {
      await createBankAccount({
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim() || "Store Owner",
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim() || undefined,
        upiId: upiId.trim() || undefined,
        balance: parseFloat(initialBalance) || 0,
        isPrimary,
      });

      setShowAddModal(false);
      setBankName("");
      setAccountHolder("");
      setAccountNumber("");
      setIfscCode("");
      setUpiId("");
      setInitialBalance("0");
      setIsPrimary(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add bank account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !transferAmount) return;
    setSubmitting(true);
    try {
      await recordBankTransfer({
        bankAccountId: selectedAccountId,
        direction,
        amount: parseFloat(transferAmount),
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setShowTransferModal(false);
      setTransferAmount("");
      setReference("");
      setNotes("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to remove this bank account?")) return;
    try {
      await deleteBankAccount(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    }
  };

  const totalBankBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const cashInHand = todayDaybook?.expectedCash || 0;
  const totalLiquidFunds = totalBankBalance + cashInHand;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Landmark className="w-7 h-7 text-emerald-600" />
            <span>Bank & UPI Accounts (Khata & Digital Money)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Maintain separate bank balances, store UPI IDs, and transfer cash between shop drawer and bank accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {accounts.length > 0 && (
            <button
              onClick={() => {
                setSelectedAccountId(accounts[0]?.id || "");
                setShowTransferModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-xl transition shadow-xs cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>Cash ⇄ Bank Transfer</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Bank Account</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wide">
              Total Bank Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            ₹{totalBankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-800/80 mt-1 font-semibold">
            Across {accounts.length} bank accounts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Galla Cash in Hand
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ₹{cashInHand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Cash available in register drawer
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
              Total Liquid Funds (Kul Rokad)
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold border border-slate-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
            ₹{totalLiquidFunds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Cash in Hand + All Bank Balances
          </div>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
          Connected Bank & UPI Accounts
        </h3>

        {loading ? (
          <div className="p-12 bg-white rounded-2xl text-center text-slate-400 text-sm font-semibold border border-slate-200">
            Loading Accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl text-center space-y-3 border border-slate-200">
            <Landmark className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No Bank Accounts Linked Yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your store's current or savings account, QR UPI ID, and keep your business digital money organized.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Bank Account</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs hover:border-emerald-400 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{acc.bankName}</h4>
                        <p className="text-[11px] text-slate-500">{acc.accountHolder}</p>
                      </div>
                    </div>

                    {acc.isPrimary && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        PRIMARY
                      </span>
                    )}
                  </div>

                  {/* Account Numbers */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[10px] text-slate-400 uppercase font-sans">A/C Number:</span>
                      <strong className="text-slate-900 tracking-wider">
                        •••• •••• {acc.accountNumber.slice(-4)}
                      </strong>
                    </div>

                    {acc.ifscCode && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] text-slate-400 uppercase font-sans">IFSC Code:</span>
                        <span className="font-bold">{acc.ifscCode}</span>
                      </div>
                    )}

                    {acc.upiId && (
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-sans flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-emerald-600" />
                          <span>UPI ID:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyUpi(acc.upiId)}
                          className="flex items-center gap-1 font-bold text-emerald-700 hover:underline cursor-pointer"
                          title="Click to copy UPI"
                        >
                          <span>{acc.upiId}</span>
                          {copiedUpi === acc.upiId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Balance & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Current Balance
                    </span>
                    <strong className="text-lg font-black text-emerald-700 tracking-tight">
                      ₹{acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setShowTransferModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
                      title="Deposit or Withdraw"
                    >
                      Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Bank Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Add New Bank Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India / HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Store / Owner Name"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5010023456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold uppercase font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">UPI ID / VPA</label>
                <input
                  type="text"
                  placeholder="e.g. storename@okaxis or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="primaryCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as primary store bank account
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Cash ⇄ Bank Transfer</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Transfer Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection("CASH_TO_BANK")}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition ${
                      direction === "CASH_TO_BANK"
                        ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Deposit: Cash → Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("BANK_TO_CASH")}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition ${
                      direction === "BANK_TO_CASH"
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Withdraw: Bank → Cash
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Bank Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} (•••• {a.accountNumber.slice(-4)}) - Balance: ₹{a.balance}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-lg font-black focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Reference / Slip / UTR</label>
                <input
                  type="text"
                  placeholder="Bank deposit slip / ATM receipt ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
