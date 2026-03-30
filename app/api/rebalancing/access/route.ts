import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { isRebalancingAllowed } from "@/lib/feature-flags";

/** Lightweight check — returns { allowed: boolean } for client-side nav gating. */
export async function GET() {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;

  return NextResponse.json({ allowed: isRebalancingAllowed(user.email) });
}
