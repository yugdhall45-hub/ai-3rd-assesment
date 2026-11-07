"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  ArrowUpRight,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  DollarSign,
  ChevronRight,
  TrendingDown,
  X,
  History,
} from "lucide-react";
import {
  getSuppliers,
  createSupplier,
  recordSupplierPayment,
  getSupplierById,
} from "@/lib/actions";

export default function CreditorsPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Supplier Form State
  const [newName, setNewName] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newOpeningBalance, setNewOpeningBalance] = useState("0");
  const [newPaymentTerms, setNewPaymentTerms] = useState("Net 30");
  const [newNotes, setNewNotes] = useState("");

  // Pay Modal State
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const loadData = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await createSupplier({
        name: newName.trim(),
        businessName: newBusinessName.trim() || undefined,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        address: newAddress.trim() || undefined,
        openingBalance: parseFloat(newOpeningBalance) || 0,
        paymentTerms: newPaymentTerms,
        notes: newNotes.trim() || undefined,
      });
      setShowAddModal(false);
      setNewName("");
      setNewBusinessName("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
      setNewOpeningBalance("0");
      setNewNotes("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create creditor");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !payAmount) return;
    setSubmitting(true);
    try {
      await recordSupplierPayment({
        supplierId: selectedSupplier.id,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        paymentDate: payDate,
        reference: payReference || undefined,
        notes: payNotes || undefined,
      });
      setShowPayModal(false);
      setPayAmount("");
      setPayReference("");
      setPayNotes("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const openLedger = async (supp: any) => {
    setSelectedSupplier(supp);
    setShowLedgerModal(true);
    try {
      const detail = await getSupplierById(supp.id);
      setLedgerData(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.businessName && s.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.creditorCode && s.creditorCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPayable = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
  const suppliersWithDues = suppliers.filter((s) => (s.currentBalance || 0) > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-600" />
            <span>Creditors & Suppliers Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Suppliers and vendors to whom the business owes payments (Lendari / Udhar Hisaab).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add New Creditor</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-800 uppercase tracking-wide">
              Total Payable (Market Udhar)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
            ₹{totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-800/80 mt-1 font-semibold">
            Suppliers to be paid
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Active Creditors
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {suppliers.length} Parties
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {suppliersWithDues.length} with pending balances
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Settlement Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {suppliers.length - suppliersWithDues.length} Settled
          </div>
          <div className="text-xs text-teal-700 mt-1 font-semibold">
            Zero pending debt
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredSuppliers.length} of {suppliers.length} Creditors
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-semibold">
            Loading Creditors...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No Creditors Found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your suppliers, wholesale dealers, and distributors to keep track of purchase bills and payments.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Creditor</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-slate-200 text-[11px] font-black uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code / Party Name</th>
                  <th className="py-3 px-4">Business / Phone</th>
                  <th className="py-3 px-4">Terms</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/80 transition font-medium">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{supplier.name}</span>
                        {supplier.creditorCode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                            {supplier.creditorCode}
                          </span>
                        )}
                      </div>
                      {supplier.address && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{supplier.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-semibold">{supplier.businessName || "—"}</div>
                      {supplier.phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {supplier.paymentTerms || "Net 30"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className={`font-black text-sm sm:text-base ${
                          supplier.currentBalance > 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        ₹{supplier.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {supplier.currentBalance > 0 ? "Pending Payment" : "All Clear"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {supplier.currentBalance > 0 && (
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setPayAmount(String(supplier.currentBalance));
                              setShowPayModal(true);
                            }}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
                          >
                            Pay Due
                          </button>
                        )}
                        <button
                          onClick={() => openLedger(supplier)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1.5 rounded-lg transition"
                          title="View Ledger Statement"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Creditor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Add New Creditor / Supplier</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Party / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Trading Co."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Business / Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Wholesale Agency"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newOpeningBalance}
                    onChange={(e) => setNewOpeningBalance(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Past pending amount you owe this supplier</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Payment Terms</label>
                  <select
                    value={newPaymentTerms}
                    onChange={(e) => setNewPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Immediate">Immediate / Cash</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Address / City</label>
                  <input
                    type="text"
                    placeholder="Shop #, Market, City"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="GSTIN, bank details, contact person..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
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
                  {submitting ? "Saving..." : "Save Creditor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Pay Creditor</h3>
                <p className="text-xs text-rose-100">{selectedSupplier.name}</p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySupplier} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">Total Outstanding Due:</span>
                <span className="text-base font-black text-rose-700">
                  ₹{selectedSupplier.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-base font-black focus:ring-2 focus:ring-rose-500"
                />

                {/* Quick amount presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(selectedSupplier.currentBalance))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg"
                  >
                    Full: ₹{selectedSupplier.currentBalance}
                  </button>
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPayAmount(String(amt))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Payment Mode</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="CASH">Cash (Galla)</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="BANK_TRANSFER">Bank NEFT/IMPS</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ref / UPI UTR / Cheque No.</label>
                <input
                  type="text"
                  placeholder="Optional reference"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger History Modal */}
      {showLedgerModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Party Ledger: {selectedSupplier.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Code: {selectedSupplier.creditorCode || "N/A"} • Balance: ₹{selectedSupplier.currentBalance}
                </p>
              </div>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Opening Balance</div>
                  <div className="text-sm font-bold text-slate-800">
                    ₹{selectedSupplier.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Current Outstanding</div>
                  <div className="text-sm font-black text-rose-600">
                    ₹{selectedSupplier.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Contact Phone</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedSupplier.phone || "—"}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Recent Purchases & Payments</span>
                </h4>

                {!ledgerData ? (
                  <div className="p-6 text-center text-slate-400">Loading ledger data...</div>
                ) : (
                  <div className="space-y-2">
                    {/* Purchases */}
                    {ledgerData.purchases?.map((pur: any) => (
                      <div
                        key={pur.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="text-emerald-700">Purchase #{pur.purchaseNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-mono">
                              {pur.dateString}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {pur.items?.length || 0} items • Paid: ₹{pur.paidAmount} • Due: ₹{pur.dueAmount}
                          </div>
                        </div>
                        <div className="text-right font-black text-slate-900">
                          ₹{pur.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}

                    {/* Payments */}
                    {ledgerData.supplierPayments?.map((pay: any) => (
                      <div
                        key={pay.id}
                        className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-rose-800 flex items-center gap-1.5">
                            <span>Payment Made ({pay.paymentMethod})</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 font-mono text-rose-700">
                              {pay.dateString}
                            </span>
                          </div>
                          <div className="text-[11px] text-rose-700/80 mt-0.5">
                            {pay.reference ? `Ref: ${pay.reference}` : pay.notes || "Supplier payment recorded"}
                          </div>
                        </div>
                        <div className="text-right font-black text-rose-600">
                          −₹{pay.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}

                    {(!ledgerData.purchases?.length && !ledgerData.supplierPayments?.length) && (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No transactions recorded for this supplier yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

