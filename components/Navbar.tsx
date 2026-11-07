"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Menu,
  LogOut,
  Bell,
} from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";

interface NavbarProps {
  businessName?: string;
  currency?: string;
  user?: {
    name: string;
    email: string;
  };
  onToggleMobileMenu?: () => void;
}

export default function Navbar({
  businessName = "SmartBazaar Local Mart",
  currency = "₹",
  user,
  onToggleMobileMenu,
}: NavbarProps) {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-2 sm:px-6 flex items-center justify-between no-print z-10 sticky top-0 shadow-md">
      <div className="flex items-center gap-1.5 sm:gap-3.5 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-700 shrink-0"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Live POS Counter Badge */}
        <div className="flex items-center gap-2 bg-slate-800/90 text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate font-mono">{currentDate || "Live Counter"}</span>
        </div>

        <span className="hidden lg:inline-block text-xs text-slate-600">|</span>
        <span className="hidden lg:inline-block text-xs font-semibold text-slate-400 truncate max-w-[220px]">
          Store: <strong className="text-white font-bold">{businessName}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Link
          href="/expenses?tab=expense&new=true"
          prefetch={true}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/40 transition active:scale-95"
          title="Add Expense"
        >
          <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="hidden sm:inline">− Expense</span>
          <span className="sm:hidden text-[11px]">Exp</span>
        </Link>

        <Link
          href="/notifications"
          prefetch={true}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-700/80 relative"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4 text-emerald-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </Link>

        <Link
          href="/billing"
          prefetch={true}
          className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition active:scale-95 uppercase tracking-wide"
          title="Open POS Register"
        >
          <Receipt className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span className="hidden sm:inline">+ POS BILL</span>
          <span className="sm:hidden text-[11px] font-black">POS</span>
        </Link>

        {user && (
          <form action={logoutAction} className="md:hidden">
            <button
              type="submit"
              title="Logout"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition border border-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
