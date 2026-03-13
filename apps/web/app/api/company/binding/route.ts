import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const employer = (url.searchParams.get("employer") ?? "").toLowerCase();
  const chainId = Number(url.searchParams.get("chainId") ?? "0");

  if (!employer || !chainId) {
    return NextResponse.json({ error: { message: "Missing employer or chainId" } }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("company_onchain_binding")
    .select("*, company:company(*)")
    .eq("employer_wallet_address", employer)
    .eq("chain_id", chainId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ binding: data?.[0] ?? null });
}