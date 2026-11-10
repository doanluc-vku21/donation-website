// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), find: vi.fn(), insert: vi.fn(), update: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
import { getOrCreateDonor } from "@/lib/queries/donors";

const input = { email: " Person@Example.com ", firstName: "", lastName: "", phone: null, stripeCustomerId: null };
const donor = { id: "donor-existing", first_name: "Existing", last_name: "Name", phone: "+15555550123", stripe_customer_id: "cus_unit" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.find.mockResolvedValue({ data: null, error: null });
  mocks.insert.mockResolvedValue({ data: { id: "donor-created" }, error: null });
  mocks.update.mockResolvedValue({ error: null });
  mocks.from.mockReturnValue({
    select: () => ({ ilike: (column: string, pattern: string) => ({ maybeSingle: () => mocks.find(column, pattern) }) }),
    insert: (values: unknown) => ({ select: () => ({ single: () => mocks.insert(values) }) }),
    update: (values: unknown) => ({ eq: (column: string, id: string) => mocks.update(column, id, values) }),
  });
});

describe("donor identity creation and conflict recovery", () => {
  it("normalizes new emails and retains the existing placeholder behavior", async () => {
    expect(await getOrCreateDonor(input)).toBe("donor-created");
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith({ email: "person@example.com", first_name: "Donor", last_name: "", phone: null, stripe_customer_id: null });
  });

  it("retains known identity fields when optional incoming fields are empty", async () => {
    mocks.find.mockResolvedValue({ data: donor, error: null });
    expect(await getOrCreateDonor(input)).toBe(donor.id);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith("id", donor.id, {
      first_name: "Existing", last_name: "Name", phone: donor.phone, stripe_customer_id: donor.stripe_customer_id,
    });
  });

  it("lets concurrent first-payment callbacks resolve the same newly created donor", async () => {
    let winner: typeof donor | null = null;
    mocks.find.mockImplementation(async () => ({ data: winner, error: null }));
    mocks.insert.mockImplementation(async () => {
      if (winner) return { data: null, error: { code: "23505", details: "private donor details" } };
      winner = { ...donor, id: "donor-winner" };
      return { data: { id: winner.id }, error: null };
    });
    expect(await Promise.all([getOrCreateDonor(input), getOrCreateDonor({ ...input, firstName: "Latest" })]))
      .toEqual(["donor-winner", "donor-winner"]);
    expect(mocks.insert).toHaveBeenCalledTimes(2);
    expect(mocks.find).toHaveBeenCalledTimes(3);
    expect(mocks.update).toHaveBeenCalledWith("id", "donor-winner", expect.objectContaining({ first_name: "Latest" }));
  });

  it("does not swallow a unique conflict unless that email's record is actually found", async () => {
    mocks.insert.mockResolvedValue({ data: null, error: { code: "23505", details: "person@example.com", message: "private insert diagnostic" } });
    await expect(getOrCreateDonor(input)).rejects.toThrow("Unable to create donor (database code 23505).");
    expect(mocks.find).toHaveBeenCalledTimes(2);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("keeps a failed recovery lookup retryable rather than returning a made-up donor", async () => {
    mocks.insert.mockResolvedValue({ data: null, error: { code: "23505" } });
    mocks.find.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: null, error: { code: "42501" } });
    await expect(getOrCreateDonor(input)).rejects.toThrow("Unable to look up donor (database code 42501).");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("matches underscore and percent email characters literally, preserving case-insensitive legacy lookup", async () => {
    await getOrCreateDonor({ ...input, email: " A_10%@Example.com " });
    expect(mocks.find).toHaveBeenCalledExactlyOnceWith("email", "a\\_10\\%@example.com");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ email: "a_10%@example.com" }));
  });

  it("does not leak database details or network exception messages into webhook logs", async () => {
    mocks.find.mockRejectedValueOnce(new Error("private network detail person@example.com"));
    await expect(getOrCreateDonor(input)).rejects.toThrow(/^Unable to look up donor\.$/);
    mocks.find.mockResolvedValueOnce({ data: donor, error: null });
    mocks.update.mockResolvedValueOnce({ error: { code: "23502", details: "person@example.com", message: "private update detail" } });
    await expect(getOrCreateDonor(input)).rejects.toThrow(/^Unable to update donor \(database code 23502\)\.$/);
  });
});
