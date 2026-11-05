import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { getBusinessProfile } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Local Business Billing & Daily Daybook App",
  description: "Track daily expenses, billing, income, daybook register, and financial reports for local stores",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let profile = { name: "SmartBazaar Local Mart", currency: "₹" };
  try {
    const fetched = await getBusinessProfile();
    if (fetched) {
      profile = { name: fetched.name, currency: fetched.currency };
    }
  } catch (e) {
    // fallback if db initial setup
  }

  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
        <Sidebar businessName={profile.name} currency={profile.currency} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar businessName={profile.name} currency={profile.currency} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

