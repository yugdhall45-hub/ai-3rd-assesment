import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET ||
  "local-billing-app-super-secure-multi-tenant-jwt-secret-key-2026-v1";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashed);
}

export async function signToken(payload: AuthUser): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// Request-lifecycle memoized user session to eliminate redundant verification calls
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("billing_session")?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
});

export const requireUser = cache(async (): Promise<AuthUser> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Please sign in to access your business account.");
  }
  return user;
});
