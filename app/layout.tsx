import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AppShell user={user} businessName={profile.name} currency={profile.currency}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
