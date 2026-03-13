import { NextResponse } from "next/server";
import { createHmac, createCipheriv, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyCompanyOwnership } from "@/lib/apiAuth";

const ENCRYPTION_KEY_REF = "v1";

function getEncryptionKey(): Buffer {
  const hex = process.env.IDENTITY_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("IDENTITY_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

function encryptField(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function hmacField(value: string): string {
  const secret = process.env.IDENTITY_HMAC_SECRET;
  if (!secret) throw new Error("IDENTITY_HMAC_SECRET env var is missing");
  return createHmac("sha256", secret).update(value.toLowerCase().trim()).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const caller_wallet = req.headers.get("x-employer-wallet") ?? "";

    const {
      company_onchain_binding_id,
      chain_id,
      wallet_address,
      given_name,
      family_name,
      dni_type,
      dni_value,
      email,
      job_title,
      start_date,
      payroll_cadence,
    } = body ?? {};

    if (
      !company_onchain_binding_id ||
      !chain_id ||
      !wallet_address ||
      !given_name ||
      !family_name ||
      !dni_type ||
      !dni_value ||
      !start_date
    ) {
      return NextResponse.json(
        { error: { message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // ── Ownership check ───────────────────────────────────────────────────────
    const ownershipError = await verifyCompanyOwnership({
      company_onchain_binding_id,
      caller_wallet,
    });
    if (ownershipError) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const walletNorm = String(wallet_address).toLowerCase();

    // ── Resolve company_id ────────────────────────────────────────────────────
    const { data: bindingRow, error: bindingErr } = await supabaseAdmin
      .from("company_onchain_binding")
      .select("company_id, payroll_contract_address")
      .eq("company_onchain_binding_id", company_onchain_binding_id)
      .single();

    if (bindingErr || !bindingRow) {
      return NextResponse.json(
        { error: { message: "company_onchain_binding not found" } },
        { status: 404 }
      );
    }

    const { company_id } = bindingRow;

    // ── Create person ─────────────────────────────────────────────────────────
    const { data: personRow, error: personErr } = await supabaseAdmin
      .from("person")
      .insert({ status: "active" })
      .select("person_id")
      .single();

    if (personErr || !personRow) {
      return NextResponse.json({ error: personErr }, { status: 500 });
    }

    const { person_id } = personRow;

    // ── Create person_identity (all PII encrypted) ────────────────────────────
    const { error: identityErr } = await supabaseAdmin
      .from("person_identity")
      .insert({
        person_id,
        given_name_enc: encryptField(given_name),
        family_name_enc: encryptField(family_name),
        dni_type,
        dni_value_enc: encryptField(dni_value),
        dni_search_hmac: hmacField(dni_value),
        email_enc: email ? encryptField(email) : null,
        encryption_key_ref: ENCRYPTION_KEY_REF,
      });

    if (identityErr) {
      await supabaseAdmin.from("person").delete().eq("person_id", person_id);
      return NextResponse.json({ error: identityErr }, { status: 500 });
    }

    // ── Create person_wallet ──────────────────────────────────────────────────
    const { data: walletRow, error: walletErr } = await supabaseAdmin
      .from("person_wallet")
      .upsert(
        { person_id, wallet_address: walletNorm, chain_id: Number(chain_id), active: true },
        { onConflict: "wallet_address,chain_id" }
      )
      .select("person_wallet_id")
      .single();

    // Supabase upsert on conflict (UPDATE path) may return null data — fall back to SELECT
    let person_wallet_id: string;
    if (walletErr) {
      await supabaseAdmin.from("person").delete().eq("person_id", person_id);
      return NextResponse.json({ error: walletErr }, { status: 500 });
    }
    if (walletRow) {
      person_wallet_id = walletRow.person_wallet_id;
    } else {
      const { data: existingWallet, error: fetchErr } = await supabaseAdmin
        .from("person_wallet")
        .select("person_wallet_id")
        .eq("wallet_address", walletNorm)
        .eq("chain_id", Number(chain_id))
        .single();
      if (fetchErr || !existingWallet) {
        await supabaseAdmin.from("person").delete().eq("person_id", person_id);
        return NextResponse.json({ error: fetchErr ?? { message: "person_wallet not found after upsert" } }, { status: 500 });
      }
      person_wallet_id = existingWallet.person_wallet_id;
    }

    // ── Create employment ─────────────────────────────────────────────────────
    const { data: employmentRow, error: employmentErr } = await supabaseAdmin
      .from("employment")
      .insert({
        company_id,
        person_id,
        start_date,
        employment_status: "active",
        job_title: job_title ?? null,
        payroll_cadence: payroll_cadence ?? "monthly",
      })
      .select("employment_id")
      .single();

    if (employmentErr || !employmentRow) {
      await supabaseAdmin.from("person").delete().eq("person_id", person_id);
      return NextResponse.json({ error: employmentErr }, { status: 500 });
    }

    const { employment_id } = employmentRow;

    // ── Create employment_chain_binding ───────────────────────────────────────
    const { error: ecbErr } = await supabaseAdmin
      .from("employment_chain_binding")
      .insert({
        employment_id,
        company_onchain_binding_id,
        person_wallet_id,
        active: true,
      });

    if (ecbErr) {
      await supabaseAdmin.from("person").delete().eq("person_id", person_id);
      return NextResponse.json({ error: ecbErr }, { status: 500 });
    }

    return NextResponse.json({ ok: true, person_id, person_wallet_id, employment_id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}