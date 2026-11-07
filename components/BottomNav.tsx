"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ArrowDownCircle,
  Users,
  Menu,
} from "lucide-react";

interface BottomNavProps {
  onOpenMenu?: () => void;
}

export default function BottomNav({ onOpenMenu }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "POS Bill", href: "/billing", icon: Receipt },
    { label: "Expenses", href: "/expenses", icon: ArrowDownCircle },
    { label: "Khata", href: "/customers", icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-center justify-around no-print">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-100 ${
              isActive
                ? "text-emerald-400 font-extrabold"
                : "text-slate-400 hover:text-white font-semibold"
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition ${
                isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : ""
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-400 hover:text-white font-semibold transition"
      >
        <div className="p-1.5 rounded-xl">
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight">Menu</span>
      </button>
    </nav>
  );
}

