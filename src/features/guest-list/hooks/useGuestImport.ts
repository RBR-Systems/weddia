import { useState } from "react";
import { App } from "antd";
import type { BulkGuestError, Guest, ImportWarning } from "../models/guestList.models";
import { parseCsvToGuests } from "../utils/guestList.utils";
import { bulkCreateGuests, fetchRelations } from "../api/guestApi";

interface UseGuestImportOptions {
  eventId: number;
  onImported: (created: Guest[], warnings: ImportWarning[], errors: BulkGuestError[]) => void;
}

interface UseGuestImportResult {
  handleFile: (file: File) => false;
  importing: boolean;
}

export const useGuestImport = ({ eventId, onImported }: UseGuestImportOptions): UseGuestImportResult => {
  const { message } = App.useApp();
  const [importing, setImporting] = useState(false);

  const handleFile = (file: File): false => {
    setImporting(true);
    (async () => {
      try {
        const text = await file.text();
        const relations = await fetchRelations();
        const { guests, warnings } = parseCsvToGuests(String(text ?? ""), relations);
        const result = await bulkCreateGuests(eventId, guests);
        onImported(result.created, warnings, result.errors);
        if (result.errors.length) {
          message.warning(
            `Imported ${result.created.length} guests, ${result.errors.length} failed`,
          );
        } else {
          message.success(`Imported ${result.created.length} guests`);
        }
      } catch (err) {
        console.error(err);
        message.error("Failed to import CSV");
      } finally {
        setImporting(false);
      }
    })();
    return false;
  };

  return { handleFile, importing };
};
