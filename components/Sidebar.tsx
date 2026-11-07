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
  ShoppingBag,
  Building2,
  Landmark,
  History,
  UserCheck,
  Bell,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";

interface SidebarProps {
  businessName?: string;
  currency?: string;
  user?: {
    name: string;
    email: string;
  };
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  businessName = "SmartBazaar Mart",
  currency = "₹",
  user,
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const navSections = [
    {
      title: "Core POS & Sales",
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "POS & Billing", href: "/billing", icon: Receipt },
        { name: "Inventory & Stock", href: "/inventory", icon: Package },
      ],
    },
    {
      title: "Khata & Parties",
      items: [
        { name: "Debtors (Customers)", href: "/customers", icon: Users },
        { name: "Creditors (Suppliers)", href: "/creditors", icon: Building2 },
        { name: "Purchases (Bills)", href: "/purchases", icon: ShoppingBag },
      ],
    },
    {
      title: "Cash & Finance",
      items: [
        { name: "Cash Book (Galla)", href: "/daybook", icon: BookOpen },
        { name: "Bank & UPI Accounts", href: "/bank", icon: Landmark },
        { name: "Daily Expenses", href: "/expenses", icon: ArrowDownCircle },
        { name: "Transactions & Audit", href: "/transactions", icon: History },
      ],
    },
    {
      title: "Store Management",
      items: [
        { name: "Reports & Financials", href: "/reports", icon: BarChart3 },
        { name: "Staff Management", href: "/staff", icon: UserCheck },
        { name: "Notifications", href: "/notifications", icon: Bell },
        { name: "Store Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
              {businessName}
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Business Management ERP
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links with Section Groups */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {sec.title}
            </div>
            {sec.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 duration-100 ${
                    isActive
                      ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/25 font-black"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 stroke-[2.2] shrink-0 ${
                      isActive ? "text-slate-950" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
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
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 sticky top-0 h-screen no-print z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex flex-col w-4/5 max-w-xs h-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
