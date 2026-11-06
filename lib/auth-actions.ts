"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, signToken } from "@/lib/auth";

export async function registerAction(data: {
  name: string;
  email: string;
  password: string;
  storeName?: string;
  currency?: string;
}) {
  try {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password;
    const storeName = data.storeName?.trim() || `${name}'s Store`;
    const currency = data.currency || "₹";

    if (!name || name.length < 2) {
      return { error: "Please enter your full name (at least 2 characters)." };
    }
    if (!email || !email.includes("@")) {
      return { error: "Please enter a valid email address." };
    }
    if (!password || password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { error: "An account with this email already exists. Please sign in instead." };
    }

    const hashedPassword = await hashPassword(password);

    // Create user and business profile in a transaction
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        businessProfile: {
          create: {
            name: storeName,
            currency,
            tagline: "Quality Products & Daily Essentials",
            taxRate: 0.0,
            email,
          },
        },
      },
    });

    // Sign session token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Set HTTP-only secure cookie
    const cookieStore = await cookies();
    cookieStore.set("billing_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  } catch (err: any) {
    console.error("Register error:", err);
    return { error: err?.message || "Failed to create account. Please try again." };
  }
}

export async function loginAction(data: { email: string; password: string }) {
  try {
    const email = data.email?.trim().toLowerCase();
    const password = data.password;

    if (!email || !email.includes("@")) {
      return { error: "Please enter a valid email address." };
    }
    if (!password) {
      return { error: "Please enter your password." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "No account found with this email. Please sign up first." };
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { error: "Incorrect password. Please try again." };
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("billing_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  } catch (err: any) {
    console.error("Login error:", err);
    return { error: err?.message || "Failed to sign in. Please try again." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("billing_session");
  redirect("/login");
}

