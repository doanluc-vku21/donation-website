import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

type DonorIdentity = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  stripe_customer_id: string | null;
};

type DonorInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  stripeCustomerId: string | null;
};

function safeDatabaseCode(error: unknown): string | undefined {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return typeof code === "string" && /^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(code) ? code : undefined;
}

export async function getOrCreateDonor(input: DonorInput): Promise<string> {
  const email = input.email.trim().toLowerCase();
  // ILIKE is used for legacy mixed-case emails, but email characters must not
  // act as SQL wildcards and accidentally select a different person's record.
  const emailPattern = email.replace(/[\\%_]/g, "\\$&");
  let operation: "look up" | "create" | "update" = "look up";
  const find = async (): Promise<DonorIdentity | null> => {
    operation = "look up";
    const { data, error } = await supabaseAdmin.from("donors")
      .select("id,first_name,last_name,phone,stripe_customer_id")
      .ilike("email", emailPattern).maybeSingle();
    if (error) throw error;
    return data as DonorIdentity | null;
  };
  const update = async (donor: DonorIdentity): Promise<string> => {
    operation = "update";
    const { error } = await supabaseAdmin.from("donors").update({
      first_name: input.firstName || donor.first_name,
      last_name: input.lastName || donor.last_name,
      phone: input.phone || donor.phone,
      stripe_customer_id: input.stripeCustomerId || donor.stripe_customer_id,
    }).eq("id", donor.id);
    if (error) throw error;
    return donor.id;
  };

  try {
    if (!email) throw new Error("Missing donor email.");
    const existing = await find();
    if (existing) return await update(existing);

    operation = "create";
    const { data, error } = await supabaseAdmin.from("donors").insert({
      first_name: input.firstName || "Donor",
      last_name: input.lastName,
      email,
      phone: input.phone,
      stripe_customer_id: input.stripeCustomerId,
    }).select("id").single();

    if (error?.code === "23505") {
      // A simultaneous Checkout/Invoice callback may have inserted this email
      // after our lookup. Re-read the actual winner instead of creating an ID,
      // then preserve the same enrichment behavior as the existing-donor path.
      const winner = await find();
      if (winner) return await update(winner);
      operation = "create";
    }
    if (error) throw error;
    if (!data?.id) throw new Error("Missing inserted donor.");
    return data.id as string;
  } catch (error) {
    // PostgreSQL details can contain donor emails. The webhook may log this
    // exception, so retain only an operation and bounded machine-readable code.
    const code = safeDatabaseCode(error);
    throw new Error(`Unable to ${operation} donor${code ? ` (database code ${code})` : ""}.`);
  }
}
