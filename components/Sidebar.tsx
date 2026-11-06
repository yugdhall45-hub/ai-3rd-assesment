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
  LogOut,
  UserCheck,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";

interface SidebarProps {
  businessName?: string;
  currency?: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function Sidebar({
  businessName = "SmartBazaar Mart",
  currency = "₹",
  user,
}: SidebarProps) {
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

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

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

      {/* User Session & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        {user && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
          <span>Currency: <strong className="text-emerald-400">{currency}</strong></span>
          <span className="flex items-center gap-1 text-slate-400">
            <UserCheck className="w-3 h-3 text-emerald-500" /> Private Store
          </span>
        </div>
      </div>
    </aside>
  );
}
