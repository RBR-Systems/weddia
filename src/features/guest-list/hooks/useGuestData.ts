import { useEffect, useState } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import { Guest, RsvpStatus, GuestFormValues } from "../models/guestList.models";
import { escapeCsv } from "../utils/guestList.utils";
import { fetchGuests, fetchRelations, removeGuest as removeGuestService, createGuest } from "../api/guestApi";

interface Relation {
  relation_id: string;
  name: string;
}

export function useGuestData(eventId: number) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [countryCodes, setCountryCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    fetch("/data/country-codes.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (mounted && data && typeof data === "object")
          setCountryCodes(data as Record<string, string>);
      })
      .catch(() => { if (mounted) setCountryCodes({}); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    fetchGuests(eventId).then(setGuests).catch(() => setGuests([]));
    fetchRelations().then(setRelations).catch(() => setRelations([]));
  }, [eventId]);

  async function handleRemoveGuest(guest_id: string) {
    try {
      await removeGuestService(guest_id);
      setGuests((prev) => prev.filter((g) => g.guest_id !== guest_id));
      message.success(t("guestList.removed", "Guest removed"));
    } catch {
      message.error(t("guestList.removeFailed", "Failed to remove guest"));
    }
  }

  async function handleAddGuest(
    values: GuestFormValues,
    onSuccess: () => void,
    setAdding: (v: boolean) => void,
  ) {
    setAdding(true);
    try {
      const saved = await createGuest(eventId, {
        first_name: values.first_name || "",
        last_name: values.last_name || "",
        email: values.email || undefined,
        phone: values.phone || undefined,
        country: values.country || undefined,
        relation_id: values.relation_id || undefined,
        rsvp_status: (values.rsvp_status as RsvpStatus) || "pending",
        party_size: Number(values.party_size) || 1,
        dietary_restrictions: values.dietary_restrictions
          ? String(values.dietary_restrictions).split(/,|;/).map((s: string) => s.trim()).filter(Boolean)
          : undefined,
        accesability_needs: values.accesability_needs || undefined,
        notes: values.notes || undefined,
        plus_one: null,
      });
      setGuests((prev) => [saved, ...prev]);
      message.success(t("guestList.added", "Guest added"));
      onSuccess();
    } catch {
      message.error(t("guestList.addFailed", "Failed to add guest"));
    } finally {
      setAdding(false);
    }
  }

  function handleExport() {
    const headers: (keyof Guest)[] = [
      "guest_id", "first_name", "last_name", "email", "phone", "party_size",
      "relation_id", "rsvp_status", "dietary_restrictions", "accesability_needs", "notes",
    ];
    let csv = headers.join(",") + "\n";
    guests.forEach((g) => {
      const row = headers.map((h) => {
        if (h === "dietary_restrictions") return escapeCsv((g.dietary_restrictions || []).join(","));
        return escapeCsv(String(g[h] ?? ""));
      });
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `guest-list-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    message.success("Guest list exported");
  }

  return { guests, setGuests, relations, countryCodes, handleRemoveGuest, handleAddGuest, handleExport };
}
