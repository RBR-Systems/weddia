"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Drawer, Descriptions, Tag, Typography, Button, Space } from "antd";
import {
  Guest,
  formatStatusLabel,
  statusColor,
} from "../../models/guestList.models";
import { formatPhone } from "@/utils/formatters.utils";
import { useTheme } from "@/theme/ThemeProvider";

const { Text, Title } = Typography;

export default function GuestDetailModal({
  guest,
  relations = [],
  onClose,
  countryCodes,
}: {
  guest: Guest;
  relations?: { relation_id: string; name: string }[];
  onClose: () => void;
  countryCodes?: Record<string, string>;
}) {
  const { mode } = useTheme();
  const { t } = useTranslation();

  const relationName =
    relations.find((r) => r.relation_id === guest.relation_id)?.name || "—";

  const mailtoLink = guest.email
    ? `mailto:${guest.email}?subject=${encodeURIComponent(
        `Guest info: ${guest.first_name} ${guest.last_name}`,
      )}&body=${encodeURIComponent(
        `Name: ${guest.first_name} ${guest.last_name}\nRelation: ${relationName}\nRSVP: ${formatStatusLabel(
          guest.rsvp_status,
        )}\nParty size: ${guest.party_size}\nEmail: ${guest.email || "—"}\nPhone: ${guest.phone || "—"}\nNotes: ${guest.notes || ""}`,
      )}`
    : undefined;

  const whatsappText = encodeURIComponent(
    `Guest info: ${guest.first_name} ${guest.last_name}\nRSVP: ${formatStatusLabel(
      guest.rsvp_status,
    )}\nParty size: ${guest.party_size}\nNotes: ${guest.notes || ""}`,
  );

  const whatsappLink = guest.phone
    ? (() => {
        // Try to normalize phone to digits only
        const digits = String(guest.phone).replace(/[^0-9]/g, "");
        if (digits.length >= 7)
          return `https://wa.me/${digits}?text=${whatsappText}`;
        return `https://api.whatsapp.com/send?text=${whatsappText}`;
      })()
    : `https://api.whatsapp.com/send?text=${whatsappText}`;

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <Title level={4} style={{ margin: 0 }}>
          {guest.first_name} {guest.last_name}
        </Title>
        <div style={{ marginTop: 6 }}>
          <Tag color={statusColor(guest.rsvp_status)}>
            {formatStatusLabel(guest.rsvp_status)}
          </Tag>
          <span style={{ marginLeft: 8 }}>
            {t("guestList.relation", "Relation")}: {relationName}
          </span>
          {guest.plus_one && (
            <a
              role="button"
              tabIndex={0}
              href="#"
              style={{ marginLeft: 12 }}
              onClick={(e) => {
                e.preventDefault();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                }
              }}
            >
              {t("guestList.plusOne", "+1")}: {guest.plus_one}
            </a>
          )}
        </div>
      </div>
      <div>
        <Space>
          {guest.email && (
            <Button type="default" href={mailtoLink} target="_blank">
              {t("guestList.sendEmail", "Send Email")}
            </Button>
          )}
          <Button type="primary" href={whatsappLink} target="_blank">
            {t("guestList.sendWhatsApp", "Send WhatsApp")}
          </Button>
        </Space>
      </div>
    </div>
  );

  return (
    <Drawer
      open={true}
      onClose={onClose}
      placement="bottom"
      height={420}
      title={header}
      footer={null}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item
          label={t("guestList.contactInfo", "Contact Information")}
        >
          <div>{guest.email || "—"}</div>
          <div>
            {formatPhone(
              guest.phone,
              guest.country ||
                (/^\+?52/.test(String(guest.phone)) ? "MX" : undefined),
              countryCodes,
            )}
          </div>
        </Descriptions.Item>

        <Descriptions.Item label={t("guestList.eventDetails", "Event Details")}>
          <div>
            {t("guestList.partySize", "Party size")}: {guest.party_size ?? "—"}
          </div>
          <div>
            {t("guestList.invitedAt", "Invited at")}: {guest.invited_at || "—"}
          </div>
          <div>
            {t("guestList.rsvpAt", "RSVP at")}: {guest.rsvp_at || "—"}
          </div>
        </Descriptions.Item>

        {(guest.dietary_restrictions &&
          guest.dietary_restrictions.length > 0) ||
        guest.accesability_needs ? (
          <Descriptions.Item
            label={t("guestList.specialRequirements", "Special Requirements")}
          >
            {guest.dietary_restrictions &&
              guest.dietary_restrictions.length > 0 && (
                <div>
                  {t("guestList.dietary", "Dietary")}:{" "}
                  {guest.dietary_restrictions.join(", ")}
                </div>
              )}
            {guest.accesability_needs && (
              <div>
                {t("guestList.accessibility", "Accessibility")}:{" "}
                {guest.accesability_needs}
              </div>
            )}
          </Descriptions.Item>
        ) : null}

        {guest.notes && (
          <Descriptions.Item label={t("guestList.notes", "Notes")}>
            <div>{guest.notes}</div>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Drawer>
  );
}
