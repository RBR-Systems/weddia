"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, Tag, Button, Segmented, Divider, Tooltip } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  CalendarOutlined,
  MessageOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Guest, RsvpStatus, formatStatusLabel, statusColor } from "../../models/guestList.models";
import type { EventCardProps } from "@/features/events-list/models/eventCardProps.models";
import { formatPhone } from "@/shared/utils/formatters.utils";
import styles from "./GuestDetailModal.module.css";

const AVATAR_COLORS: Record<RsvpStatus, string> = {
  attending: "#52c41a",
  maybe: "#1677ff",
  pending: "#faad14",
  not_attending: "#bfbfbf",
};

const RSVP_OPTIONS: { label: string; value: RsvpStatus }[] = [
  { label: "Attending", value: "attending" },
  { label: "Maybe", value: "maybe" },
  { label: "Pending", value: "pending" },
  { label: "Not Attending", value: "not_attending" },
];

function formatEventDate(rawDate?: string): string {
  if (!rawDate) return "";
  const d = new Date(rawDate);
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(rawDate?: string): string {
  if (!rawDate) return "";
  const d = new Date(rawDate);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return "";
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function buildWhatsAppText(guest: Guest, event?: EventCardProps): string {
  const name = guest.first_name;
  const eventName = event?.eventName ?? "el evento";
  const dateStr = formatEventDate(event?.rawDate) || event?.date || "";
  const timeStr = formatEventTime(event?.rawDate);
  const location = event?.location ?? "";

  const lines: string[] = [];

  lines.push(`¡Hola ${name}! 🎉`);
  lines.push("");
  lines.push(`Te escribimos para confirmarte tu invitación a *${eventName}*.`);
  lines.push("");
  lines.push("📋 *Detalles del evento:*");
  if (dateStr) lines.push(`📅 Fecha: ${dateStr}`);
  if (timeStr) lines.push(`🕐 Hora: ${timeStr}`);
  if (location) lines.push(`📍 Lugar: ${location}`);
  if (guest.party_size && guest.party_size > 0) {
    lines.push(`👥 Personas: ${guest.party_size}`);
  }

  const dietary = guest.dietary_restrictions?.filter(Boolean) ?? [];
  const accessibility = guest.accesability_needs?.trim() ?? "";

  if (dietary.length > 0 || accessibility) {
    lines.push("");
    lines.push("✏️ *Hemos registrado tus preferencias:*");
    if (dietary.length > 0) lines.push(`🍽️ Alimentación: ${dietary.join(", ")}`);
    if (accessibility) lines.push(`♿ Accesibilidad: ${accessibility}`);
  }

  lines.push("");
  lines.push("¿Confirmas tu asistencia?");
  lines.push("✅ *SÍ* – Asistiré");
  lines.push("❌ *NO* – No podré asistir");
  lines.push("🤔 *QUIZÁS* – Aún no estoy seguro/a");
  lines.push("");
  lines.push("¡Esperamos verte pronto! 😊");

  return lines.join("\n");
}

function buildEmailSubject(event?: EventCardProps): string {
  const eventName = event?.eventName ?? "Evento";
  const dateStr = event?.date ?? "";
  return dateStr ? `Invitación: ${eventName} – ${dateStr}` : `Invitación: ${eventName}`;
}

function buildEmailBody(guest: Guest, event?: EventCardProps): string {
  const name = `${guest.first_name} ${guest.last_name}`.trim();
  const eventName = event?.eventName ?? "el evento";
  const dateStr = formatEventDate(event?.rawDate) || event?.date || "";
  const timeStr = formatEventTime(event?.rawDate);
  const location = event?.location ?? "";
  const description = event?.description?.trim() ?? "";

  const lines: string[] = [];

  lines.push(`Hola ${name},`);
  lines.push("");
  lines.push(`Te escribimos para confirmarte los detalles de tu invitación a ${eventName}.`);
  lines.push("");
  lines.push("DETALLES DEL EVENTO");
  lines.push("─".repeat(30));
  if (dateStr) lines.push(`Fecha:  ${dateStr}`);
  if (timeStr) lines.push(`Hora:   ${timeStr}`);
  if (location) lines.push(`Lugar:  ${location}`);
  if (description) {
    lines.push("");
    lines.push(description);
  }

  const dietary = guest.dietary_restrictions?.filter(Boolean) ?? [];
  const accessibility = guest.accesability_needs?.trim() ?? "";

  if (dietary.length > 0 || accessibility) {
    lines.push("");
    lines.push("TUS PREFERENCIAS REGISTRADAS");
    lines.push("─".repeat(30));
    if (dietary.length > 0) lines.push(`Restricciones alimenticias: ${dietary.join(", ")}`);
    if (accessibility) lines.push(`Necesidades de accesibilidad: ${accessibility}`);
  }

  if (guest.party_size && guest.party_size > 1) {
    lines.push("");
    lines.push(`Tu reservación es para ${guest.party_size} persona(s).`);
  }

  lines.push("");
  lines.push("─".repeat(30));
  lines.push("Por favor, confirma tu asistencia respondiendo a este correo.");
  lines.push("¿Asistirás al evento? Esperamos tu respuesta.");
  lines.push("");
  lines.push("¡Con gusto te esperamos!");
  lines.push("");
  lines.push("Equipo organizador");

  return lines.join("\n");
}

interface Props {
  guest: Guest;
  event?: EventCardProps;
  relations?: { relation_id: string; name: string }[];
  onClose: () => void;
  onUpdateRsvp: (guestId: string, status: RsvpStatus) => Promise<void>;
  countryCodes?: Record<string, string>;
}

export default function GuestDetailModal({
  guest,
  event,
  relations = [],
  onClose,
  onUpdateRsvp,
  countryCodes,
}: Props) {
  const { t } = useTranslation();
  const [savingRsvp, setSavingRsvp] = useState(false);

  const relationName =
    relations.find((r) => r.relation_id === guest.relation_id)?.name ?? "—";

  const initials = [guest.first_name?.[0], guest.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";

  const avatarColor = AVATAR_COLORS[guest.rsvp_status] ?? "#8c8c8c";

  const formattedPhone = formatPhone(
    guest.phone,
    guest.country ?? (/^\+?52/.test(String(guest.phone)) ? "MX" : undefined),
    countryCodes,
  );

  const phoneDigits = String(guest.phone ?? "").replaceAll(/[^0-9]/g, "");
  const whatsappText = buildWhatsAppText(guest, event);
  const whatsappLink = phoneDigits.length >= 7
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(whatsappText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  const mailtoLink = guest.email
    ? `mailto:${guest.email}?subject=${encodeURIComponent(buildEmailSubject(event))}&body=${encodeURIComponent(buildEmailBody(guest, event))}`
    : undefined;

  const invitedDate = guest.invited_at
    ? new Date(guest.invited_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const rsvpDate = guest.rsvp_at
    ? new Date(guest.rsvp_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  async function handleRsvpChange(value: string | number) {
    const status = value as RsvpStatus;
    if (status === guest.rsvp_status) return;
    setSavingRsvp(true);
    try {
      await onUpdateRsvp(guest.guest_id, status);
    } finally {
      setSavingRsvp(false);
    }
  }

  return (
    <Drawer
      open={true}
      onClose={onClose}
      placement="right"
      width={460}
      title={t("guestList.guestDetails", "Guest Details")}
      footer={
        <div className={styles.footer}>
          {guest.email && (
            <Button
              icon={<MailOutlined />}
              href={mailtoLink}
              target="_blank"
              block
            >
              {t("guestList.sendEmail", "Send Email")}
            </Button>
          )}
          <Button
            type="primary"
            icon={<MessageOutlined />}
            href={whatsappLink}
            target="_blank"
            block
          >
            WhatsApp
          </Button>
        </div>
      }
    >
      {/* Header: avatar + name + badges */}
      <div className={styles.header}>
        <div className={styles.avatar} style={{ background: avatarColor }}>
          {initials}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.name}>
            {guest.first_name} {guest.last_name}
          </div>
          <div className={styles.badges}>
            <Tag color={statusColor(guest.rsvp_status)}>
              {formatStatusLabel(guest.rsvp_status)}
            </Tag>
            <Tag icon={<UserOutlined />} color="default">
              {relationName}
            </Tag>
            {guest.plus_one && (
              <Tag color="purple">
                {t("guestList.plusOne", "+1")}: {guest.plus_one}
              </Tag>
            )}
          </div>
        </div>
      </div>

      {/* RSVP Status Selector */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {t("guestList.rsvpStatus", "RSVP Status")}
        </div>
        <Segmented
          className={styles.rsvpSegment}
          value={guest.rsvp_status}
          disabled={savingRsvp}
          onChange={handleRsvpChange}
          options={RSVP_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          block
        />
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Contact */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {t("guestList.contactInfo", "Contact")}
        </div>
        {guest.email ? (
          <div className={styles.contactRow}>
            <MailOutlined className={styles.contactIcon} />
            <Tooltip title={guest.email}>
              <span className={styles.contactValue}>{guest.email}</span>
            </Tooltip>
          </div>
        ) : (
          <div className={styles.contactRow}>
            <MailOutlined className={styles.contactIcon} />
            <span className={styles.contactValue} style={{ opacity: 0.4 }}>—</span>
          </div>
        )}
        <div className={styles.contactRow}>
          <PhoneOutlined className={styles.contactIcon} />
          <span className={styles.contactValue}>{formattedPhone || "—"}</span>
        </div>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Event Details */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {t("guestList.eventDetails", "Event Details")}
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <TeamOutlined style={{ marginRight: 4 }} />
              {t("guestList.partySize", "Party Size")}
            </span>
            <span className={styles.infoValue}>{guest.party_size ?? "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              {t("guestList.relation", "Relation")}
            </span>
            <span className={styles.infoValue}>{relationName}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {t("guestList.invitedAt", "Invited")}
            </span>
            <span className={styles.infoValue}>{invitedDate}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              {t("guestList.rsvpAt", "RSVP'd")}
            </span>
            <span className={styles.infoValue}>{rsvpDate}</span>
          </div>
        </div>
      </div>

      {/* Special Requirements */}
      {((guest.dietary_restrictions && guest.dietary_restrictions.length > 0) ||
        guest.accesability_needs) && (
        <>
          <Divider style={{ margin: "16px 0" }} />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {t("guestList.specialRequirements", "Special Requirements")}
            </div>
            {guest.dietary_restrictions && guest.dietary_restrictions.length > 0 && (
              <div className={styles.dietaryTags} style={{ marginBottom: guest.accesability_needs ? 8 : 0 }}>
                {guest.dietary_restrictions.map((d) => (
                  <Tag key={d} color="green">{d}</Tag>
                ))}
              </div>
            )}
            {guest.accesability_needs && (
              <Tag color="blue">{guest.accesability_needs}</Tag>
            )}
          </div>
        </>
      )}

      {/* Notes */}
      {guest.notes && (
        <>
          <Divider style={{ margin: "16px 0" }} />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {t("guestList.notes", "Notes")}
            </div>
            <div className={styles.notes}>{guest.notes}</div>
          </div>
        </>
      )}
    </Drawer>
  );
}
