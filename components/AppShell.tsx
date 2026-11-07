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
  const [pageTransition, setPageTransition] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
    setPageTransition(true);
    const timer = setTimeout(() => setPageTransition(false), 250);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 antialiased relative">
      {/* Ultra-sleek top transition line */}
      {pageTransition && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 z-50 animate-pulse" />
      )}
      <Sidebar
        user={user}
        businessName={businessName}
        currency={currency}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          user={user}
          businessName={businessName}
          currency={currency}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div key={pathname} className="animate-in fade-in-50 duration-150">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
