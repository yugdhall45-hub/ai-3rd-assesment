"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Receipt, ArrowDownCircle, ArrowUpCircle, Calendar, User, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth-actions";

interface NavbarProps {
  businessName?: string;
  currency?: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function Navbar({
  businessName = "SmartBazaar Local Mart",
  currency = "₹",
  user,
}: NavbarProps) {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between no-print z-10 sticky top-0 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currentDate || "Today"}</span>
        </div>
        <span className="hidden md:inline-block text-xs text-slate-400">|</span>
        <span className="hidden md:inline-block text-xs font-medium text-slate-500">
          Store Active: <strong className="text-slate-700">{businessName}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/expenses?tab=expense&new=true"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
        >
          <ArrowDownCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>+ Expense</span>
        </Link>

        <Link
          href="/expenses?tab=income&new=true"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
        >
          <ArrowUpCircle className="w-3.5 h-3.5 text-teal-600" />
          <span>+ Income</span>
        </Link>

        <Link
          href="/billing"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>+ New Bill (POS)</span>
        </Link>

        {user && (
          <form action={logoutAction} className="md:hidden">
            <button
              type="submit"
              title="Logout"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
