import { describe, expect, it } from "vitest";
import { normalize, parseCsvToGuests } from "./guestList.utils";

const RELATIONS = [
  { relation_id: "1", name: "Family" },
  { relation_id: "2", name: "Amigos" },
  { relation_id: "3", name: "Compañeros de Trabajo" },
];

const csvFrom = (headers: string[], rows: string[][]): string =>
  [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

describe("normalize", () => {
  it("lowercases, strips accents, and trims", () => {
    expect(normalize("  Compañeros DE Trabajo  ")).toBe("companeros de trabajo");
  });
});

describe("parseCsvToGuests - relation_id resolution", () => {
  it("keeps a numeric relation_id that already exists in the catalog (backward compatibility)", () => {
    const csv = csvFrom(
      ["first_name", "last_name", "relation_id"],
      [["Jane", "Doe", "1"]],
    );
    const { guests, warnings } = parseCsvToGuests(csv, RELATIONS);
    expect(guests[0].relation_id).toBe("1");
    expect(warnings).toHaveLength(0);
  });

  it("resolves a group name with different case/accents to the correct catalog id", () => {
    const csv = csvFrom(
      ["first_name", "last_name", "relation_id"],
      [["John", "Smith", "AMIGOS"]],
    );
    const { guests, warnings } = parseCsvToGuests(csv, RELATIONS);
    expect(guests[0].relation_id).toBe("2");
    expect(warnings).toHaveLength(0);
  });

  it("resolves an accented group name column named 'grupo' regardless of accents/case", () => {
    const csv = csvFrom(
      ["first_name", "last_name", "grupo"],
      [["Ana", "Perez", "companeros de trabajo"]],
    );
    const { guests, warnings } = parseCsvToGuests(csv, RELATIONS);
    expect(guests[0].relation_id).toBe("3");
    expect(warnings).toHaveLength(0);
  });

  it("leaves relation_id unassigned and warns when the group name does not exist", () => {
    const csv = csvFrom(
      ["first_name", "last_name", "relation_id"],
      [["Bob", "Nobody", "Vecinos Inexistentes"]],
    );
    const { guests, warnings } = parseCsvToGuests(csv, RELATIONS);
    expect(guests[0].relation_id).toBeUndefined();
    expect(warnings).toEqual([
      { row: 2, field: "relation_id", rawValue: "Vecinos Inexistentes" },
    ]);
  });
});

describe("parseCsvToGuests - rsvp_status mapping", () => {
  it("accepts values already in the app's internal vocabulary", () => {
    const csv = csvFrom(
      ["first_name", "last_name", "rsvp_status"],
      [
        ["A", "A", "attending"],
        ["B", "B", "not_attending"],
        ["C", "C", "maybe"],
        ["D", "D", "pending"],
      ],
    );
    const { guests, warnings } = parseCsvToGuests(csv, RELATIONS);
    expect(guests.map((g) => g.rsvp_status)).toEqual([
      "attending",
      "not_attending",
      "maybe",
      "pending",
    ]);
    expect(warnings).toHaveLength(0);
  });

  it("maps synonyms (EN/ES, case/accent-insensitive) to the internal vocabulary", () => {
    const csv = csvFrom(
      ["first_name", "last_name", "rsvp_status"],
      [
        ["A", "A", "confirmed"],
        ["B", "B", "Confirmado"],
        ["C", "C", "declined"],
        ["D", "D", "Rechazada"],
        ["E", "E", "pendiente"],
        ["F", "F", "tal vez"],
      ],
    );
    const { guests, warnings } = parseCsvToGuests(csv, RELATIONS);
    expect(guests.map((g) => g.rsvp_status)).toEqual([
      "attending",
      "attending",
      "not_attending",
      "not_attending",
      "pending",
      "maybe",
    ]);
    expect(warnings).toHaveLength(0);
  });

  it("falls back to 'pending' and warns for an unrecognized rsvp_status value", () => {
    const csv = csvFrom(
      ["first_name", "last_name", "rsvp_status"],
      [["Weird", "Value", "maybe-later-idk"]],
    );
    const { guests, warnings } = parseCsvToGuests(csv, RELATIONS);
    expect(guests[0].rsvp_status).toBe("pending");
    expect(warnings).toEqual([
      { row: 2, field: "rsvp_status", rawValue: "maybe-later-idk" },
    ]);
  });

  it("defaults missing rsvp_status to 'pending' without a warning", () => {
    const csv = csvFrom(["first_name", "last_name"], [["No", "Status"]]);
    const { guests, warnings } = parseCsvToGuests(csv, RELATIONS);
    expect(guests[0].rsvp_status).toBe("pending");
    expect(warnings).toHaveLength(0);
  });
});
