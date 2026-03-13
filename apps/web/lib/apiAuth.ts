import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Verifies that a given wallet address is the registered employer
 * for the requested company_onchain_binding_id.
 *
 * Pass this the `x-employer-wallet` header value from every company-scoped
 * API route. Returns null if valid, or an error message string if not.
 *
 * NOTE: This performs a database-level ownership check (wallet address must
 * match the binding's employer_wallet_address). It does NOT cryptographically
 * verify that the HTTP caller controls that wallet — for that, implement
 * SIWE (Sign-In With Ethereum) session tokens.
 * For the current threat model (UUID guessing), this is sufficient.
 */
export async function verifyCompanyOwnership(params: {
  company_onchain_binding_id: string;
  caller_wallet: string;
}): Promise<{ error: string } | null> {
  if (!params.caller_wallet || !params.company_onchain_binding_id) {
    return { error: "Missing ownership verification parameters" };
  }

  const { data: binding, error } = await supabaseAdmin
    .from("company_onchain_binding")
    .select("employer_wallet_address")
    .eq("company_onchain_binding_id", params.company_onchain_binding_id)
    .single();

  if (error || !binding) {
    return { error: "Company binding not found" };
  }

  if (binding.employer_wallet_address.toLowerCase() !== params.caller_wallet.toLowerCase()) {
    return { error: "Forbidden: wallet does not own this company" };
  }

  return null; // verified ownership of the company by this employer wallet
}