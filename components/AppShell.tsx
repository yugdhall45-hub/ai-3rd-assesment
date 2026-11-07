"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface AppShellProps {
  user: {
    userId: string;
    email: string;
    name: string;
  };
  businessName: string;
  currency: string;
  children: React.ReactNode;
}

export default function AppShell({
  user,
  businessName,
  currency,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentBusinessName, setCurrentBusinessName] = useState(businessName);
  const [currentCurrency, setCurrentCurrency] = useState(currency);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail?.name) setCurrentBusinessName(e.detail.name);
      if (e.detail?.currency) setCurrentCurrency(e.detail.currency);
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 antialiased">
      <Sidebar
        user={user}
        businessName={currentBusinessName}
        currency={currentCurrency}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          user={user}
          businessName={currentBusinessName}
          currency={currentCurrency}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
