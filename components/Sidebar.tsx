"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ArrowDownCircle,
  BookOpen,
  Users,
  Package,
  BarChart3,
  Settings,
  Store,
} from "lucide-react";

interface SidebarProps {
  businessName?: string;
  currency?: string;
}

export default function Sidebar({ businessName = "SmartBazaar Mart", currency = "₹" }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "POS & Billing", href: "/billing", icon: Receipt },
    { name: "Daily Expenses", href: "/expenses", icon: ArrowDownCircle },
    { name: "Daybook Register", href: "/daybook", icon: BookOpen },
    { name: "Customers & Khata", href: "/customers", icon: Users },
    { name: "Inventory Items", href: "/inventory", icon: Package },
    { name: "Reports & Analytics", href: "/reports", icon: BarChart3 },
    { name: "Store Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 no-print flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Store className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-white text-base tracking-tight truncate">
            {businessName}
          </h1>
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Billing & Daybook POS
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="bg-slate-800/70 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Currency Mode</span>
            <span className="font-bold text-emerald-400">{currency} Default</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Offline-first SQLite local business bookkeeping.
          </div>
        </div>
      </div>
    </aside>
  );
}

