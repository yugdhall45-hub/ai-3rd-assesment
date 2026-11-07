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
    <header className="h-16 bg-white border-b border-slate-200 px-2 sm:px-6 flex items-center justify-between no-print z-10 sticky top-0 shadow-xs">
      <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 shrink-0"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium shrink-0">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline truncate">{currentDate || "Today"}</span>
        </div>

        <span className="hidden lg:inline-block text-xs text-slate-400">|</span>
        <span className="hidden lg:inline-block text-xs font-medium text-slate-500 truncate max-w-[200px]">
          Store Active: <strong className="text-slate-700">{businessName}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        <Link
          href="/expenses?tab=expense&new=true"
          prefetch={true}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
          title="Add Expense"
        >
          <ArrowDownCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="hidden sm:inline">+ Expense</span>
          <span className="sm:hidden text-[11px]">Exp</span>
        </Link>

        <Link
          href="/expenses?tab=income&new=true"
          prefetch={true}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
          title="Add Other Income"
        >
          <ArrowUpCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="hidden sm:inline">+ Income</span>
          <span className="sm:hidden text-[11px]">Inc</span>
        </Link>

        <Link
          href="/billing"
          prefetch={true}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
          title="New POS Bill"
        >
          <Receipt className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">+ New Bill (POS)</span>
          <span className="sm:hidden text-[11px]">POS</span>
        </Link>

        {user && (
          <form action={logoutAction} className="md:hidden">
            <button
              type="submit"
              title="Logout"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
