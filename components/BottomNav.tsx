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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-center justify-around no-print">
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
                ? "text-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                isActive ? "bg-emerald-50 text-emerald-600" : ""
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium transition"
      >
        <div className="p-1 rounded-xl">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
      </button>
    </nav>
  );
}
