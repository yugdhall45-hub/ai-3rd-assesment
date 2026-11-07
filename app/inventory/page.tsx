"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  X,
  Layers,
} from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getBusinessProfile,
} from "@/lib/actions";

let cachedInventoryData: { products: any[]; profile: any } | null = null;

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>(() => cachedInventoryData?.products || []);
  const [profile, setProfile] = useState<any>(() => cachedInventoryData?.profile || { currency: "₹" });
  const [loading, setLoading] = useState(!cachedInventoryData);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("General");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("pcs");

  const currency = profile.currency || "₹";

  const loadData = async (silent = false) => {
    if (!silent && !cachedInventoryData) setLoading(true);
    try {
      const [prods, prof] = await Promise.all([
        getProducts(),
        getBusinessProfile(),
      ]);
      setProducts(prods);
      setProfile(prof);
      cachedInventoryData = { products: prods, profile: prof };
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(Boolean(cachedInventoryData));
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setSku("");
    setCategory("General");
    setCostPrice("");
    setSellingPrice("");
    setStock("20");
    setUnit("pcs");
    setShowModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setSku(p.sku || "");
    setCategory(p.category || "General");
    setCostPrice(String(p.costPrice));
    setSellingPrice(String(p.sellingPrice));
    setStock(String(p.stock));
    setUnit(p.unit || "pcs");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice) return;

    try {
      if (editingId) {
        await updateProduct(editingId, {
          name: name.trim(),
          sku: sku.trim() || undefined,
          category: category.trim(),
          costPrice: parseFloat(costPrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          stock: parseInt(stock, 10) || 0,
          unit: unit.trim(),
        });
      } else {
        await createProduct({
          name: name.trim(),
          sku: sku.trim() || undefined,
          category: category.trim(),
          costPrice: parseFloat(costPrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          stock: parseInt(stock, 10) || 0,
          unit: unit.trim(),
        });
      }
      setShowModal(false);
      cachedInventoryData = null;
      await loadData(true);
    } catch (err) {
      alert("Error saving item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      cachedInventoryData = null;
      await loadData(true);
    } catch (err) {
      alert("Error deleting product");
    }
  };

  const totalWholesaleValue = products.reduce((s, p) => s + p.costPrice * p.stock, 0);
  const totalRetailValue = products.reduce((s, p) => s + p.sellingPrice * p.stock, 0);
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;

  const categories = Array.from(new Set(products.map((p) => p.category || "General")));

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter ? p.category === categoryFilter : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Inventory Items (Dukaan ka Samaan)</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage product catalog, real-time stock levels, purchase costs, and profit margins.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-4 py-2.5 sm:py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Naya Samaan Jodein</span>
        </button>
      </div>

      {/* KPI Cards (2 cols on mobile, 3 on tablet/desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-slate-600 uppercase">
              Total Stock Value (Cost)
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {currency}{totalWholesaleValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
            Wholesale investment value
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-slate-600 uppercase">
              Retail Value (Selling)
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            {currency}{totalRetailValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] sm:text-xs text-emerald-800/80 mt-0.5 font-semibold">
            Expected revenue from stock
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 sm:p-5 rounded-2xl border-2 border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-amber-800 uppercase">
              Low / Out of Stock
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-3xl font-black text-amber-700 tracking-tight">
            {outOfStockCount + lowStockCount} items
          </div>
          <div className="text-[10px] sm:text-xs text-amber-800/80 mt-0.5 font-semibold">
            {outOfStockCount > 0 ? `${outOfStockCount} out of stock` : "Needs replenishment"}
          </div>
        </div>
      </div>

      {/* Product Catalog */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No products found.
            </div>
          ) : (
            filtered.map((prod) => {
              const profit = prod.sellingPrice - prod.costPrice;
              const isOutOfStock = prod.stock <= 0;
              const isLowStock = prod.stock > 0 && prod.stock <= 10;

              return (
                <div key={prod.id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-slate-900 text-sm">{prod.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {prod.category}
                        </span>
                        {prod.sku && (
                          <span className="text-[10px] font-mono text-slate-400">
                            SKU: {prod.sku}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-emerald-700 text-base">
                        {currency}{prod.sellingPrice}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Cost: {currency}{prod.costPrice} (+{currency}{profit.toFixed(0)})
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-semibold">Stock:</span>
                      <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? "bg-rose-100 text-rose-700"
                          : isLowStock
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {prod.stock} {prod.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(prod)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prod.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900 text-slate-200 text-[11px] font-black uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Margin</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((prod) => {
                const profit = prod.sellingPrice - prod.costPrice;
                const marginPercent =
                  prod.sellingPrice > 0 ? ((profit / prod.sellingPrice) * 100).toFixed(0) : "0";
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= 10;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{prod.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{prod.sku || "—"}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{currency}{prod.costPrice}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{currency}{prod.sellingPrice}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        +{currency}{profit.toFixed(0)} ({marginPercent}%)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${isOutOfStock ? "text-rose-600 font-extrabold" : isLowStock ? "text-amber-600" : "text-slate-800"}`}>
                          {prod.stock} {prod.unit}
                        </span>
                        {isOutOfStock ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Out
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Low
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded transition"
                        title="Edit Product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prod.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Product (Bottom Sheet on Mobile) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? "Edit Product Details" : "Add New Item to Inventory"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Basmati Rice 5kg"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Grocery"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barcode / SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Optional barcode"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gm">Gram (gm)</option>
                    <option value="litre">Litre (L)</option>
                    <option value="packet">Packet (pkt)</option>
                    <option value="box">Box (box)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md active:scale-95"
                >
                  {editingId ? "Update Item" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
