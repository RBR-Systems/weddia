import type { Guest } from "../models/guestList.models";

/**
 * Creates a fully-typed Guest with all defaults applied.
 * Pass overrides for only the fields you care about — usable in both
 * production builders and tests.
 *
 * @example
 * // Test
 * const vip = createGuest({ first_name: "Ana", rsvp_status: "attending", party_size: 2 });
 */
export function createGuest(overrides: Partial<Guest> = {}): Guest {
  return {
    guest_id: "",
    first_name: "",
    last_name: "",
    rsvp_status: "pending",
    party_size: 1,
    ...overrides,
  };
}
