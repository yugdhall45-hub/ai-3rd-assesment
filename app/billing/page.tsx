"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  Printer,
  FileText,
  User,
  Check,
  AlertCircle,
  CreditCard,
  RefreshCw,
  X,
  Calendar,
} from "lucide-react";
import {
  getProducts,
  getCustomers,
  getInvoices,
  createInvoice,
  getBusinessProfile,
  markInvoicePaid,
  createCustomer,
} from "@/lib/actions";

interface CartItem {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

// In-memory client cache to make route switching between Dashboard & POS 100% instantaneous without jitter
let cachedBillingData: {
  products: any[];
  customers: any[];
  invoices: any[];
  profile: any;
} | null = null;

export default function BillingPage() {
  const [products, setProducts] = useState<any[]>(() => cachedBillingData?.products || []);
  const [customers, setCustomers] = useState<any[]>(() => cachedBillingData?.customers || []);
  const [invoices, setInvoices] = useState<any[]>(() => cachedBillingData?.invoices || []);
  const [profile, setProfile] = useState<any>(
    () => cachedBillingData?.profile || { name: "SmartBazaar Local Mart", currency: "₹", taxRate: 5 }
  );
  const [loading, setLoading] = useState(!cachedBillingData);

  // Active Tab: 'pos' or 'history'
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");

  // Cart & Bill State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "CREDIT">("CASH");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");

  // Modals
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");

  // Print modal / state
  const [currentInvoiceForPrint, setCurrentInvoiceForPrint] = useState<any>(null);
  const [printMode, setPrintMode] = useState<"thermal" | "a4">("thermal");

  // Payment collection modal
  const [collectModalInv, setCollectModalInv] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState<string>("");
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectDate, setCollectDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Custom manual item entry
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");

  const currency = profile.currency || "₹";

  const loadData = async (silent = false) => {
    if (!silent && !cachedBillingData) setLoading(true);
    try {
      const [prods, custs, invs, prof] = await Promise.all([
        getProducts(),
        getCustomers(),
        getInvoices(50),
        getBusinessProfile(),
      ]);
      setProducts(prods);
      setCustomers(custs);
      setInvoices(invs);
      setProfile(prof);
      cachedBillingData = { products: prods, customers: custs, invoices: invs, profile: prof };
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If cached data is already present, fetch silently in background (stale-while-revalidate)
    loadData(Boolean(cachedBillingData));

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setProfile((prev: any) => ({ ...prev, ...e.detail }));
        if (cachedBillingData) {
          cachedBillingData.profile = { ...cachedBillingData.profile, ...e.detail };
        }
      }
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = applyTax ? (profile.taxRate || 0) : 0;
  const effectiveDiscount = Math.min(Math.max(0, discountAmount || 0), subtotal);
  const taxableAmount = Math.max(0, subtotal - effectiveDiscount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = Math.round(taxableAmount + taxAmount);

  // Sync paidAmount when grandTotal changes or paymentMethod changes
  useEffect(() => {
    if (paymentMethod === "CREDIT") {
      setPaidAmount("0");
    } else {
      setPaidAmount(String(grandTotal));
    }
  }, [grandTotal, paymentMethod]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: product.sellingPrice,
          quantity: 1,
          total: product.sellingPrice,
        },
      ];
    });
  };

  const addCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice) return;
    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) return;

    setCart((prev) => [
      ...prev,
      {
        productName: customItemName.trim(),
        unitPrice: price,
        quantity: 1,
        total: price,
      },
    ]);
    setCustomItemName("");
    setCustomItemPrice("");
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: newQty, total: Math.round(newQty * item.unitPrice * 100) / 100 }
          : item
      )
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCart([]);
    setSelectedCustomerId("");
    setCustomerName("Walk-in Customer");
    setCustomerPhone("");
    setDiscountAmount(0);
    setPaymentMethod("CASH");
    setPaidAmount("");
    setNotes("");
  };

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (id === "") {
      setCustomerName("Walk-in Customer");
      setCustomerPhone("");
    } else {
      const cust = customers.find((c) => c.id === id);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone || "");
      }
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      const created = await createCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim() || undefined,
        address: newCustAddress.trim() || undefined,
      });
      setCustomers((prev) => [...prev, created]);
      setSelectedCustomerId(created.id);
      setCustomerName(created.name);
      setCustomerPhone(created.phone || "");
      setShowNewCustomerModal(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustAddress("");
    } catch (err) {
      alert("Error saving customer");
    }
  };

  const handleSaveInvoice = async (mode: "save" | "thermal" | "a4") => {
    if (cart.length === 0) {
      alert("Please add at least one item to the bill.");
      return;
    }

    const paidNum = parseFloat(paidAmount) || 0;
    const isCreditOrDue = paymentMethod === "CREDIT" || paidNum < grandTotal;

    if (isCreditOrDue && !selectedCustomerId) {
      alert("Khata / Credit bills require selecting or adding a Customer so that pending dues can be recorded in their Khata account.");
      return;
    }

    try {
      const inv = await createInvoice({
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim() || undefined,
        items: cart,
        subtotal,
        discount: effectiveDiscount,
        tax: taxAmount,
        total: grandTotal,
        paidAmount: paidNum,
        paymentMethod,
        dateString: invoiceDate,
        notes: notes.trim() || undefined,
      });

      // Optimistic local state update for instant UI feedback
      setInvoices((prev) => [inv, ...prev]);
      setProducts((prev) =>
        prev.map((p) => {
          const cartItem = cart.find((c) => c.productId === p.id);
          return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
        })
      );

      resetForm();

      if (mode === "thermal" || mode === "a4") {
        setCurrentInvoiceForPrint(inv);
        setPrintMode(mode);
      }

      // Sync data in background silently
      loadData(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save bill. Please try again.");
    }
  };

  const handleSettleDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectModalInv || !collectAmount) return;
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await markInvoicePaid(collectModalInv.id, amount, collectMethod, collectDate);
      setCollectModalInv(null);
      setCollectAmount("");
      await loadData();
    } catch (err) {
      alert("Error updating payment");
    }
  };

  // Filtered products for search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Point of Sale & Billing
          </h2>
          <p className="text-slate-500 text-xs">
            Generate retail receipts, manage Khata credit bills, and print thermal / A4 invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "pos"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Create New Bill
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Previous Bills ({invoices.length})
          </button>
        </div>
      </div>

      {activeTab === "pos" ? (
        /* POS SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Product Catalog & Item Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item by name or barcode SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Quick Add Grid */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredProducts.slice(0, 12).map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="p-3 text-left bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 rounded-xl transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-xs line-clamp-1 group-hover:text-emerald-700">
                        {prod.name}
                      </div>
                      <div className="text-[11px] mt-0.5">
                        {prod.stock <= 0 ? (
                          <span className="text-rose-600 font-semibold">Out of Stock</span>
                        ) : prod.stock <= 5 ? (
                          <span className="text-amber-600 font-medium">Low: {prod.stock} {prod.unit}</span>
                        ) : (
                          <span className="text-slate-400">Stock: {prod.stock} {prod.unit}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        {currency}{prod.sellingPrice}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        +
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Custom Item Add (for loose items not in catalog) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                + Quick Custom / Unlisted Item
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Loose Sugar 500g)"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder={`Price (${currency})`}
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Items in Cart Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Bill Items ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Clear Bill
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Your bill is empty. Select items from above or search product catalog.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cart.map((item, index) => (
                    <div key={index} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {currency}{item.unitPrice} each
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded transition"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) updateQuantity(index, val);
                          }}
                          className="w-10 text-center font-bold text-slate-800 bg-white border border-slate-200 rounded text-xs py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded transition"
                        >
                          +
                        </button>
                      </div>

                      {/* Total */}
                      <div className="w-20 text-right font-bold text-slate-900">
                        {currency}{item.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Customer, Discounts, Totals & Checkout (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Customer Picker & Bill Date */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              {/* Bill Date Selector */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Bill Date
                </span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  title="Choose past date to backdate this bill"
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Customer Details
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(true)}
                  className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New Customer
                </button>
              </div>

              <div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Walk-in Customer (General Counter Sale)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""} {c.totalDues > 0 ? `[Due: ${currency}${c.totalDues}]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomerId === "" && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Walk-in Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Calculations & Payment Methods */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    {currency}{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">− {currency}</span>
                    <input
                      type="number"
                      value={discountAmount || ""}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Tax ({profile.taxRate || 0}%)</span>
                  </label>
                  <span className="font-semibold text-slate-800">
                    +{currency}{taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-extrabold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-emerald-700">
                    {currency}{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Payment Mode
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {(["CASH", "UPI", "CARD", "CREDIT"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        paymentMethod === mode
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {mode === "CREDIT" ? "Khata/Due" : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount & Due Calculation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Amount Received:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">{currency}</span>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {grandTotal > (parseFloat(paidAmount) || 0) && (
                  <div className="flex justify-between text-xs text-amber-700 font-semibold pt-1 border-t border-slate-200/60">
                    <span>Pending Due (Added to Khata):</span>
                    <span>{currency}{(grandTotal - (parseFloat(paidAmount) || 0)).toFixed(2)}</span>
                  </div>
                )}

                {(parseFloat(paidAmount) || 0) > grandTotal && (
                  <div className="flex justify-between text-xs text-emerald-700 font-semibold pt-1 border-t border-slate-200/60">
                    <span>Change to Return to Customer:</span>
                    <span>{currency}{((parseFloat(paidAmount) || 0) - grandTotal).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveInvoice("thermal")}
                  disabled={cart.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save & Print Thermal Receipt</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice("a4")}
                    disabled={cart.length === 0}
                    className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold text-xs py-2.5 rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print A4 Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveInvoice("save")}
                    disabled={cart.length === 0}
                    className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Bill Only</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* INVOICES HISTORY TAB */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Recent Bills & Invoices</h3>
            <span className="text-xs text-slate-500">Showing last 50 transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Bill No.</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Items</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Mode</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(inv.date).toLocaleDateString()} {new Date(inv.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {inv.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {inv.items.length} items
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {currency}{inv.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 uppercase">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.paymentStatus === "PAID" && (
                        <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                          Paid
                        </span>
                      )}
                      {inv.paymentStatus === "PARTIAL" && (
                        <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                          Due: {currency}{inv.dueAmount}
                        </span>
                      )}
                      {inv.paymentStatus === "DUE" && (
                        <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {inv.dueAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCollectModalInv(inv);
                            setCollectAmount(String(inv.dueAmount));
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded text-[11px] transition"
                        >
                          Collect Due
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentInvoiceForPrint(inv);
                          setPrintMode("thermal");
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] transition"
                      >
                        Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentInvoiceForPrint(inv);
                          setPrintMode("a4");
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] transition"
                      >
                        A4
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: New Customer Quick Create */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9823011223"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Shop 4, Market Complex"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
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

      {/* MODAL: Collect Due Payment */}
      {collectModalInv && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Collect Due Payment</h3>
              <button
                onClick={() => setCollectModalInv(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettleDue} className="mt-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <div>Bill: <strong>{collectModalInv.invoiceNumber}</strong></div>
                <div>Customer: <strong>{collectModalInv.customerName}</strong></div>
                <div>Outstanding Due: <strong className="text-rose-600">{currency}{collectModalInv.dueAmount}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={collectDate}
                  onChange={(e) => setCollectDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCollectModalInv(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT VIEW OVERLAY / DIALOG */}
      {currentInvoiceForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintMode("thermal")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    printMode === "thermal"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  80mm Thermal Receipt
                </button>
                <button
                  onClick={() => setPrintMode("a4")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    printMode === "a4"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Standard A4 Invoice
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now
                </button>
                <button
                  onClick={() => setCurrentInvoiceForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRINT CONTAINER (visible to printer and on-screen preview) */}
            <div className="print-container mt-4">
              {printMode === "thermal" ? (
                /* 80mm Thermal Receipt Layout */
                <div className="thermal-receipt border border-dashed border-slate-300 rounded p-4 text-center">
                  <div className="font-bold text-base tracking-tight">{profile.name}</div>
                  <div className="text-[11px] text-slate-600">{profile.tagline}</div>
                  <div className="text-[11px] text-slate-600">{profile.address}</div>
                  <div className="text-[11px] text-slate-600">Ph: {profile.phone}</div>
                  {profile.taxId && (
                    <div className="text-[11px] font-mono mt-0.5">{profile.taxId}</div>
                  )}

                  <div className="my-2 border-b border-dashed border-slate-400"></div>

                  <div className="text-left text-[11px] space-y-0.5">
                    <div><strong>Bill #:</strong> {currentInvoiceForPrint.invoiceNumber}</div>
                    <div><strong>Date:</strong> {new Date(currentInvoiceForPrint.date).toLocaleString()}</div>
                    <div><strong>Customer:</strong> {currentInvoiceForPrint.customerName}</div>
                    {currentInvoiceForPrint.customerPhone && (
                      <div><strong>Phone:</strong> {currentInvoiceForPrint.customerPhone}</div>
                    )}
                  </div>

                  <div className="my-2 border-b border-dashed border-slate-400"></div>

                  {/* Items list */}
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Price</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInvoiceForPrint.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-1">{item.productName}</td>
                          <td className="py-1 text-center">{item.quantity}</td>
                          <td className="py-1 text-right">{item.unitPrice}</td>
                          <td className="py-1 text-right">{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="my-2 border-b border-dashed border-slate-400"></div>

                  <div className="space-y-1 text-right text-[11px]">
                    <div>Subtotal: {currency}{currentInvoiceForPrint.subtotal}</div>
                    {currentInvoiceForPrint.discount > 0 && (
                      <div>Discount: −{currency}{currentInvoiceForPrint.discount}</div>
                    )}
                    {currentInvoiceForPrint.tax > 0 && (
                      <div>Tax: +{currency}{currentInvoiceForPrint.tax}</div>
                    )}
                    <div className="text-xs font-bold pt-1 border-t border-slate-400">
                      Grand Total: {currency}{currentInvoiceForPrint.total}
                    </div>
                    <div>Mode: {currentInvoiceForPrint.paymentMethod}</div>
                    <div>Paid: {currency}{currentInvoiceForPrint.paidAmount}</div>
                    {currentInvoiceForPrint.dueAmount > 0 && (
                      <div className="font-bold text-rose-600">
                        Remaining Due: {currency}{currentInvoiceForPrint.dueAmount}
                      </div>
                    )}
                  </div>

                  <div className="my-3 border-b border-dashed border-slate-400"></div>

                  <div className="text-[11px] italic text-slate-600">
                    {profile.receiptFooter}
                  </div>
                </div>
              ) : (
                /* A4 Standard Tax Invoice Layout */
                <div className="p-6 border border-slate-200 rounded-lg text-slate-800 space-y-6">
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
                      <p className="text-xs text-slate-500">{profile.tagline}</p>
                      <p className="text-xs text-slate-500 mt-1">{profile.address}</p>
                      <p className="text-xs text-slate-500">Phone: {profile.phone} | Email: {profile.email}</p>
                      <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{profile.taxId}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        TAX INVOICE
                      </span>
                      <div className="mt-2 text-xs">
                        <div><strong>Invoice #:</strong> {currentInvoiceForPrint.invoiceNumber}</div>
                        <div><strong>Date:</strong> {new Date(currentInvoiceForPrint.date).toLocaleDateString()}</div>
                        <div><strong>Status:</strong> {currentInvoiceForPrint.paymentStatus}</div>
                      </div>
                    </div>
                  </div>

                  {/* Customer details */}
                  <div className="bg-slate-50 p-3 rounded-lg text-xs grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-bold text-slate-500 uppercase text-[10px]">Billed To:</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{currentInvoiceForPrint.customerName}</div>
                      {currentInvoiceForPrint.customerPhone && (
                        <div>Phone: {currentInvoiceForPrint.customerPhone}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-500 uppercase text-[10px]">Payment Details:</div>
                      <div>Mode: <strong>{currentInvoiceForPrint.paymentMethod}</strong></div>
                      <div>Amount Paid: <strong>{currency}{currentInvoiceForPrint.paidAmount}</strong></div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <table className="w-full text-left text-xs border">
                    <thead className="bg-slate-100 text-slate-700 border-b">
                      <tr>
                        <th className="p-2 border-r">#</th>
                        <th className="p-2 border-r">Item Description</th>
                        <th className="p-2 border-r text-center">Qty</th>
                        <th className="p-2 border-r text-right">Unit Price</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentInvoiceForPrint.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 border-r text-slate-400">{idx + 1}</td>
                          <td className="p-2 border-r font-medium">{item.productName}</td>
                          <td className="p-2 border-r text-center">{item.quantity}</td>
                          <td className="p-2 border-r text-right">{currency}{item.unitPrice}</td>
                          <td className="p-2 text-right font-bold">{currency}{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Breakdown */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>{currency}{currentInvoiceForPrint.subtotal}</span>
                      </div>
                      {currentInvoiceForPrint.discount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Discount:</span>
                          <span>−{currency}{currentInvoiceForPrint.discount}</span>
                        </div>
                      )}
                      {currentInvoiceForPrint.tax > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Tax ({profile.taxRate}%):</span>
                          <span>+{currency}{currentInvoiceForPrint.tax}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t">
                        <span>Grand Total:</span>
                        <span>{currency}{currentInvoiceForPrint.total}</span>
                      </div>
                      {currentInvoiceForPrint.dueAmount > 0 && (
                        <div className="flex justify-between font-bold text-xs text-rose-600 pt-1">
                          <span>Balance Due:</span>
                          <span>{currency}{currentInvoiceForPrint.dueAmount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t text-center text-xs text-slate-400">
                    {profile.receiptFooter}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

