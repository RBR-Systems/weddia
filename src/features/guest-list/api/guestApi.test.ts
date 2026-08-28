import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CreateGuestPayload } from "./guestApi";

const apiPostMock = vi.fn();

vi.mock("@/shared/api/apiClient", () => ({
  apiGet: vi.fn(),
  apiPost: (...args: unknown[]) => apiPostMock(...args),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number) {
      super("mock api error");
      this.status = status;
    }
  },
}));

describe("bulkCreateGuests", () => {
  beforeEach(() => {
    apiPostMock.mockReset();
  });

  it("calls the bulk endpoint with mapped payload and returns created guests", async () => {
    const { bulkCreateGuests } = await import("./guestApi");

    apiPostMock.mockResolvedValue({
      created: [
        {
          guestId: 1,
          eventId: 42,
          firstName: "Jane",
          lastName: "Doe",
          relationId: 1,
          rsvpStatus: "confirmed",
          partySize: 2,
        },
      ],
      errors: [],
    });

    const payload: CreateGuestPayload[] = [
      {
        first_name: "Jane",
        last_name: "Doe",
        relation_id: "1",
        rsvp_status: "attending",
        party_size: 2,
      },
    ];

    const result = await bulkCreateGuests(42, payload);

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledWith(
      "/api/guests/bulk?adminId=1",
      expect.objectContaining({
        guests: [expect.objectContaining({ eventId: 42, firstName: "Jane" })],
      }),
    );
    expect(result.created).toHaveLength(1);
    expect(result.created[0].rsvp_status).toBe("attending");
    expect(result.errors).toHaveLength(0);
  });

  it("does not throw when the response includes partial errors", async () => {
    const { bulkCreateGuests } = await import("./guestApi");

    apiPostMock.mockResolvedValue({
      created: [
        {
          guestId: 1,
          eventId: 42,
          firstName: "Jane",
          lastName: "Doe",
          relationId: 1,
          rsvpStatus: "confirmed",
          partySize: 1,
        },
      ],
      errors: [{ index: 1, reason: "Missing last name" }],
    });

    const payload: CreateGuestPayload[] = [
      { first_name: "Jane", last_name: "Doe", rsvp_status: "attending", party_size: 1 },
      { first_name: "Broken", last_name: "", rsvp_status: "pending", party_size: 1 },
    ];

    await expect(bulkCreateGuests(42, payload)).resolves.toEqual({
      created: expect.arrayContaining([
        expect.objectContaining({ first_name: "Jane" }),
      ]),
      errors: [{ index: 1, reason: "Missing last name" }],
    });
  });
});
