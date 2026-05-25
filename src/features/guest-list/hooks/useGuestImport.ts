import { useState } from "react";
import { App } from "antd";
import type { Guest } from "../models/guestList.models";
import { parseCsvToGuests } from "../utils/guestList.utils";

interface UseGuestImportOptions {
  onImported: (guests: Guest[]) => void;
  onClose: () => void;
}

interface UseGuestImportResult {
  handleFile: (file: File) => false;
  importing: boolean;
}

export const useGuestImport = ({ onImported, onClose }: UseGuestImportOptions): UseGuestImportResult => {
  const { message } = App.useApp();
  const [importing, setImporting] = useState(false);

  const handleFile = (file: File): false => {
    setImporting(true);
    file.text()
      .then((text) => {
        try {
          const guests = parseCsvToGuests(String(text ?? ""));
          onImported(guests);
          message.success(`Imported ${guests.length} guests`);
        } catch (err) {
          console.error(err);
          message.error("Failed to import CSV");
        } finally {
          setImporting(false);
          onClose();
        }
      })
      .catch((err) => {
        console.error(err);
        message.error("Failed to read file");
        setImporting(false);
        onClose();
      });
    return false;
  };

  return { handleFile, importing };
};
