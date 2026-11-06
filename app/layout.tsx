import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessProfile } from "@/lib/actions";

export const metadata: Metadata = {
  title: "SmartBazaar - Local Business Billing & Daybook POS",
  description:
    "Secure & isolated cloud billing, daily expenses, daybook register, khata and financial reports",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // If user is not authenticated, render auth view (login / register) without dashboard chrome
  if (!user) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
          {children}
        </body>
      </html>
    );
  }

  let profile = { name: `${user.name}'s Store`, currency: "₹" };
  try {
    const fetched = await getBusinessProfile();
    if (fetched) {
      profile = { name: fetched.name, currency: fetched.currency };
    }
  } catch {
    // fallback
  }

  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 antialiased">
        <Sidebar user={user} businessName={profile.name} currency={profile.currency} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar user={user} businessName={profile.name} currency={profile.currency} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
