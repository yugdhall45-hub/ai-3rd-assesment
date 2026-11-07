"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  Package,
  Users,
  Building2,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { getSystemNotifications } from "@/lib/actions";

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await getSystemNotifications();
        setAlerts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
          <Bell className="w-7 h-7 text-emerald-600" />
          <span>System Notifications & Action Alerts (Dukan Alerts)</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Automated business reminders for low inventory stock, customer khata balances, supplier payables, and daybook closing.
        </p>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl text-center text-slate-400 text-sm font-semibold border border-slate-200">
          Scanning system for business alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl text-center space-y-3 border-2 border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <div className="text-lg font-black text-slate-900">All Clear! No Pending Alerts</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Your inventory stock is healthy, there are no overdue khata debts, and all business registers are in order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border-2 shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                alert.type === "WARNING"
                  ? "bg-rose-50/70 border-rose-200 hover:border-rose-400"
                  : alert.type === "INFO"
                  ? "bg-amber-50/70 border-amber-200 hover:border-amber-400"
                  : "bg-teal-50/70 border-teal-200 hover:border-teal-400"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    alert.type === "WARNING"
                      ? "bg-rose-100 text-rose-700"
                      : alert.type === "INFO"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {alert.id.includes("stock") ? (
                    <Package className="w-5 h-5" />
                  ) : alert.id.includes("debtors") ? (
                    <Users className="w-5 h-5" />
                  ) : alert.id.includes("creditors") ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                    {alert.description}
                  </p>
                </div>
              </div>

              <Link
                href={alert.link}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white transition active:scale-95 shrink-0 self-start sm:self-auto shadow-xs"
              >
                <span>View & Action</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

