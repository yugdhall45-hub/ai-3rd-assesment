"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Calendar,
  Building2,
  Package,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  X,
  FileText,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import {
  getPurchases,
  createPurchase,
  getSuppliers,
  getProducts,
} from "@/lib/actions";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Purchase Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [items, setItems] = useState<
    Array<{
      productId?: string;
      productName: string;
      quantity: number;
      unitCost: number;
      total: number;
    }>
  >([{ productName: "", quantity: 1, unitCost: 0, total: 0 }]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    try {
      const [purData, suppData, prodData] = await Promise.all([
        getPurchases(100),
        getSuppliers(),
        getProducts(),
      ]);
      setPurchases(purData);
      setSuppliers(suppData);
      setProducts(prodData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const discountVal = parseFloat(discount) || 0;
  const taxVal = parseFloat(tax) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal + taxVal);
  const paidVal = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - paidVal);

  const handleAddItemRow = () => {
    setItems([...items, { productName: "", quantity: 1, unitCost: 0, total: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const newItems = [...items];
    newItems[index] = {
      productId: prod.id,
      productName: prod.name,
      quantity: newItems[index].quantity || 1,
      unitCost: prod.costPrice || 0,
      total: (newItems[index].quantity || 1) * (prod.costPrice || 0),
    };
    setItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: "productName" | "quantity" | "unitCost",
    val: any
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    if (field === "productName") {
      item.productName = val;
    } else if (field === "quantity") {
      item.quantity = Math.max(1, parseInt(val) || 1);
      item.total = item.quantity * item.unitCost;
    } else if (field === "unitCost") {
      item.unitCost = Math.max(0, parseFloat(val) || 0);
      item.total = item.quantity * item.unitCost;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSupplierSelect = (suppId: string) => {
    setSelectedSupplierId(suppId);
    const supp = suppliers.find((s) => s.id === suppId);
    if (supp) {
      setSupplierName(supp.name);
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !items.some((i) => i.productName.trim())) {
      alert("Please add at least one valid product item to the purchase.");
      return;
    }
    setSubmitting(true);
    try {
      const validItems = items
        .filter((i) => i.productName.trim())
        .map((i) => ({
          productId: i.productId || undefined,
          productName: i.productName.trim(),
          quantity: i.quantity,
          unitCost: i.unitCost,
          total: i.total,
        }));

      await createPurchase({
        supplierId: selectedSupplierId || undefined,
        supplierName: supplierName.trim() || undefined,
        dateString: purchaseDate,
        items: validItems,
        subtotal,
        discount: discountVal,
        tax: taxVal,
        total: grandTotal,
        paidAmount: paidVal,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      setShowAddModal(false);
      // Reset form
      setSelectedSupplierId("");
      setSupplierName("");
      setItems([{ productName: "", quantity: 1, unitCost: 0, total: 0 }]);
      setDiscount("0");
      setTax("0");
      setPaidAmount("");
      setNotes("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDue = purchases.reduce((sum, p) => sum + p.dueAmount, 0);

  const filteredPurchases = purchases.filter(
    (p) =>
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            <span>Purchases & Supplier Bills (Kharidari)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Record wholesale purchase invoices, increase store inventory automatically, and manage supplier dues.
          </p>
        </div>

        <button
          onClick={() => {
            setPaidAmount("");
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Record Purchase Bill</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wide">
              Total Purchases Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ₹{totalPurchasesAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {purchases.length} wholesale bills recorded
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wide">
              Paid Amount (Nokad Kharid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-800/80 mt-1 font-semibold">
            Cash / Bank paid to suppliers
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-800 uppercase tracking-wide">
              Pending Dues (Udhar Kharid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
            ₹{totalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-700 mt-1 font-semibold">
            Balance added to creditors ledger
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by bill number, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredPurchases.length} of {purchases.length} Bills
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-semibold">
            Loading Purchase Bills...
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No Purchase Bills Recorded Yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Record new inventory purchases from your suppliers to track bills, cost prices, and stock additions automatically.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Purchase</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-slate-200 text-[11px] font-black uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bill No / Date</th>
                  <th className="py-3 px-4">Supplier / Firm</th>
                  <th className="py-3 px-4">Items / Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Total Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/80 transition font-medium">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">
                        {purchase.purchaseNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{purchase.dateString}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{purchase.supplierName}</div>
                      <div className="text-[11px] text-slate-400">
                        Method: {purchase.paymentMethod}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-bold text-slate-900">
                        {purchase.items?.length || 0} Products
                      </span>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {purchase.items?.map((i: any) => `${i.productName} (${i.quantity})`).join(", ")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                          purchase.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : purchase.paymentStatus === "PARTIAL"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-emerald-700">
                        ₹{purchase.paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      {purchase.dueAmount > 0 && (
                        <div className="text-[10px] text-rose-600 font-bold">
                          Due: ₹{purchase.dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm sm:text-base">
                      ₹{purchase.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Record Purchase Bill (Kharidari)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Supplier & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Select Supplier / Creditor</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Direct / Walk-in Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.businessName ? `(${s.businessName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedSupplierId && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Supplier Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Trading Co."
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Bill Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Purchase Items & Quantities</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2"
                    >
                      {/* Product Selector / Text */}
                      <div className="flex-1 space-y-1">
                        <select
                          onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                        >
                          <option value="">-- Choose from existing inventory --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Current Stock: {p.stock})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          required
                          placeholder="Product Name"
                          value={item.productName}
                          onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="w-24 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-bold block sm:hidden">Qty</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-center focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="w-28 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-bold block sm:hidden">Cost (₹)</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Cost ₹"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(idx, "unitCost", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-right focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Total */}
                      <div className="w-28 text-right font-black text-slate-900 text-xs sm:text-sm px-2">
                        ₹{item.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>

                      {/* Remove Button */}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Summary & Payment */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Subtotal</span>
                    <strong className="text-base text-white">
                      ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Discount (₹)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tax / GST (₹)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Grand Total</span>
                    <strong className="text-xl text-emerald-400 font-black">
                      ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Paid Now (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setPaidAmount(String(grandTotal))}
                        className="text-[10px] text-emerald-400 hover:underline font-bold"
                      >
                        Full Paid
                      </button>
                      <span className="text-slate-500">|</span>
                      <button
                        type="button"
                        onClick={() => setPaidAmount("0")}
                        className="text-[10px] text-rose-400 hover:underline font-bold"
                      >
                        Full Credit (Udhar)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white"
                    >
                      <option value="CASH">Cash (Galla)</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="BANK_TRANSFER">Bank Account</option>
                      <option value="CREDIT">Supplier Credit</option>
                    </select>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-[11px] text-slate-400 font-bold block">
                      Remaining Due (Payable)
                    </span>
                    <strong
                      className={`text-lg font-black block mt-0.5 ${
                        dueAmount > 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      ₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                    {dueAmount > 0 && selectedSupplierId && (
                      <span className="text-[10px] text-slate-400">
                        Added to supplier balance automatically
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
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
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving & Updating Stock..." : "Confirm & Save Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

