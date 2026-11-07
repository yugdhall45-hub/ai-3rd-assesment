"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Store,
  DollarSign,
  Printer,
  Check,
  RefreshCw,
  Save,
} from "lucide-react";
import { getBusinessProfile, updateBusinessProfile } from "@/lib/actions";

// Module-level in-memory cache for instant 0ms tab switching
let cachedProfileData: any = null;

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(() => cachedProfileData);
  const [loading, setLoading] = useState(!cachedProfileData);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadProfile = async (silent = false) => {
    if (!silent && !cachedProfileData) setLoading(true);
    try {
      const p = await getBusinessProfile();
      setProfile(p);
      cachedProfileData = p;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile(Boolean(cachedProfileData));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSuccessMsg("");

    try {
      const payload = {
        name: profile.name,
        tagline: profile.tagline || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        taxId: profile.taxId || "",
        currency: profile.currency || "₹",
        receiptFooter: profile.receiptFooter || "",
        taxRate: parseFloat(profile.taxRate) || 0,
      };
      await updateBusinessProfile(payload);
      cachedProfileData = { ...profile, ...payload };
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: payload }));
      }
      setSuccessMsg("Settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>Store Profile & Billing Settings</span>
          </h2>
          <p className="text-slate-500 text-xs">
            Configure your shop name, invoice header/footer, tax rate, and active currency.
          </p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Business Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store / Business Name *
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Business Subtitle
              </label>
              <input
                type="text"
                value={profile.tagline || ""}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Phone Number
              </label>
              <input
                type="text"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Email
              </label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Address (Printed on Invoices & Receipts)
              </label>
              <input
                type="text"
                value={profile.address || ""}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN / Tax Registration ID
              </label>
              <input
                type="text"
                value={profile.taxId || ""}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                placeholder="e.g. GSTIN: 27AABCS1429B1Z8"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Currency & Taxation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Currency & Tax Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <select
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              >
                <option value="₹">₹ (Indian Rupee - INR)</option>
                <option value="$">$ (US Dollar - USD)</option>
                <option value="€">€ (Euro - EUR)</option>
                <option value="£">£ (British Pound - GBP)</option>
                <option value="د.إ">د.إ (UAE Dirham - AED)</option>
                <option value="₨">₨ (Pakistani / Sri Lankan Rupee)</option>
                <option value="৳">৳ (Bangladeshi Taka - BDT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={profile.taxRate}
                onChange={(e) => setProfile({ ...profile, taxRate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Receipt Print Customizer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Receipt & Thermal Print Customization</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Receipt Footer Note (Printed at bottom of thermal and A4 bills)
            </label>
            <input
              type="text"
              value={profile.receiptFooter || ""}
              onChange={(e) => setProfile({ ...profile, receiptFooter: e.target.value })}
              placeholder="e.g. Thank you for your visit! Please come again."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Store Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

