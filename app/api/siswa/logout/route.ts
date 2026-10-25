import { NextResponse } from "next/server";
import { clearSiswaCookie } from "../../../lib/server/session";

export const runtime = "nodejs";

export async function POST() {
  await clearSiswaCookie();
  return NextResponse.json({ ok: true });
}
