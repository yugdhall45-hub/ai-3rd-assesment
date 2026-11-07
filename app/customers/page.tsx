"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  X,
  Receipt,
  DollarSign,
} from "lucide-react";
import {
  getCustomers,
  createCustomer,
  recordCustomerPayment,
  getBusinessProfile,
} from "@/lib/actions";

// Module-level in-memory cache for instant 0ms tab switching
let cachedCustomersData: { customers: any[]; profile: any } | null = null;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>(() => cachedCustomersData?.customers || []);
  const [profile, setProfile] = useState<any>(() => cachedCustomersData?.profile || { currency: "₹" });
  const [loading, setLoading] = useState(!cachedCustomersData);
  const [search, setSearch] = useState("");
  const [filterDueOnly, setFilterDueOnly] = useState(false);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Settlement Modal
  const [activePaymentCustomer, setActivePaymentCustomer] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState("");

  const currency = profile.currency || "₹";

  const loadData = async (silent = false) => {
    if (!silent && !cachedCustomersData) setLoading(true);
    try {
      const [custs, prof] = await Promise.all([
        getCustomers(),
        getBusinessProfile(),
      ]);
      setCustomers(custs);
      setProfile(prof);
      cachedCustomersData = { customers: custs, profile: prof };
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(Boolean(cachedCustomersData));
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setName("");
      setPhone("");
      setAddress("");
      setNotes("");
      setShowAddModal(false);
      cachedCustomersData = null; // invalidate cache so fresh data loads
      await loadData(true);
    } catch (err) {
      alert("Error adding customer");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentCustomer || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;

    try {
      await recordCustomerPayment({
        customerId: activePaymentCustomer.id,
        amount: amt,
        paymentMethod: payMethod,
        dateString: payDate,
        notes: payNotes.trim() || `Khata debt repayment by ${activePaymentCustomer.name}`,
      });
      setActivePaymentCustomer(null);
      setPayAmount("");
      setPayNotes("");
      cachedCustomersData = null; // invalidate cache
      await loadData(true);
    } catch (err) {
      alert("Error recording payment");
    }
  };

  const totalOutstanding = customers.reduce((s, c) => s + (c.totalDues || 0), 0);
  const customersWithDues = customers.filter((c) => (c.totalDues || 0) > 0);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search));
    const matchDue = filterDueOnly ? (c.totalDues || 0) > 0 : true;
    return matchSearch && matchDue;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Customers & Khata (Udhar) Ledger</span>
          </h2>
          <p className="text-slate-500 text-xs">
            Manage customer credit accounts, track pending debts, and record repayments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Khata Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-amber-700 tracking-tight">
            {currency}{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending payments to collect</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customers with Dues</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">
            {customersWithDues.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Customers owing credit balances</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Registered</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">
            {customers.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">In store customer book</div>
        </div>
      </div>

      {/* Directory & Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterDueOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                !filterDueOnly ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              All Customers ({customers.length})
            </button>
            <button
              onClick={() => setFilterDueOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterDueOnly ? "bg-amber-600 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Only With Dues ({customersWithDues.length})
            </button>
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer Name</th>
                <th className="py-3 px-4 font-semibold">Contact & Address</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold">Outstanding Due</th>
                <th className="py-3 px-4 font-semibold text-right">Khata Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => {
                  const hasDue = (cust.totalDues || 0) > 0;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                        {cust.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">{cust.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {cust.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                        {cust.address && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{cust.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasDue ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-semibold px-2.5 py-1 rounded-full text-[11px]">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Pending Khata
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> All Clear
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`font-bold text-sm ${hasDue ? "text-amber-700" : "text-slate-400"}`}>
                          {currency}{(cust.totalDues || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {hasDue ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePaymentCustomer(cust);
                              setPayAmount(String(cust.totalDues));
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Record Payment</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">No dues</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add Customer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Register New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9811223344"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop 2, Main Street"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Monthly credit limit ₹5,000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Customer Debt Repayment */}
      {activePaymentCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Record Khata Payment</h3>
              <button onClick={() => setActivePaymentCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <div>Customer: <strong>{activePaymentCustomer.name}</strong></div>
                <div>Current Khata Debt: <strong className="text-amber-700">{currency}{activePaymentCustomer.totalDues}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Repayment Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {/* Quick Khata Tender Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(activePaymentCustomer.totalDues || 0))}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-extrabold active:scale-95 transition"
                  >
                    Full Balance ({currency}{activePaymentCustomer.totalDues})
                  </button>
                  {[500, 1000, 2000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPayAmount(String(preset))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold active:scale-95 transition"
                    >
                      {currency}{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CASH">Cash (Adds to Drawer)</option>
                  <option value="UPI">UPI / GooglePay / PhonePe</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank Transfer / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Cleared October grocery bill"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePaymentCustomer(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

