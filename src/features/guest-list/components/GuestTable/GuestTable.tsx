"use client";

import { Table, Tag, Space, Typography, Button, Input, Popconfirm } from "antd";
import { useTranslation } from "react-i18next";
import { MailOutlined, MessageOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Guest, formatStatusLabel, statusColor, STATUS_LABELS } from "../../models/guestList.models";
import { formatPhone } from "@/utils/formatters.utils";
import { useTheme } from "@/theme/ThemeProvider";
import { light as lightTokens, dark as darkTokens } from "@/theme/tokens";
import Link from "antd/es/typography/Link";

const { Text } = Typography;

interface Relation {
  relation_id: string;
  name: string;
}

export default function GuestTable({
  guests,
  allGuests,
  relations,
  onSelect,
  filters,
  onFiltersChange,
  onRemoveGuest,
  countryCodes,
}: {
  guests: Guest[];
  allGuests?: Guest[];
  relations?: Relation[];
  onSelect: (g: Guest) => void;
  filters?: {
    query?: string;
    relation_id?: string | null | string[];
    status?: "all" | string | string[];
    specials?: string[];
  };
  onFiltersChange?: (v: {
    query?: string | undefined;
    relation_id?: string | null | string[] | undefined;
    status?: string | string[] | undefined;
    specials?: string[] | undefined;
  }) => void;
  onRemoveGuest?: (guest_id: string) => void | Promise<void>;
  countryCodes?: Record<string, string>;
}) {
  const { t } = useTranslation();
  const { mode } = useTheme();

  const colors = mode === "dark" ? darkTokens : lightTokens;
  const waBg = colors.completed;
  const emailBg = colors.inProgress;

  const specialValues = new Set<string>();
  (allGuests || guests).forEach((g) => {
    (g.dietary_restrictions || []).forEach((d) => specialValues.add(d));
    if (g.accesability_needs) specialValues.add(g.accesability_needs);
  });
  const specialOptions = Array.from(specialValues);

  const columns: ColumnsType<Guest> = [
    {
      title: t("guestList.guest", "Guest"),
      dataIndex: "first_name",
      key: "guest",
      width: 160,
      ellipsis: true,
      render: (_: any, record: Guest) => (
        <div>
          <Text strong>
            <Link
              onClick={(e) => {
                e.stopPropagation();
                onSelect(record);
              }}
            >
              {record.first_name} {record.last_name}
            </Link>
          </Text>
        </div>
      ),
      sorter: (a: Guest, b: Guest) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`,
        ),
      // Add a column search filter for guest name (controlled by parent via `filters.query`)
      filteredValue: filters?.query ? [filters.query] : null,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t("guestList.searchName", "Search name")}
            value={selectedKeys[0] as string}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                onFiltersChange?.({ query: String(selectedKeys[0] ?? "") });
              }}
              size="small"
            >
              {t("guestList.search", "Search")}
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                confirm();
                onFiltersChange?.({ query: undefined });
              }}
              size="small"
            >
              {t("guestList.reset", "Reset")}
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value: any, record: Guest) =>
        `${record.first_name} ${record.last_name}`
          .toLowerCase()
          .includes(String(value).toLowerCase()),
    },
    {
      title: t("guestList.party", "Party"),
      dataIndex: "party_size",
      key: "party",
      width: 70,
      align: "center" as const,
      render: (ps: number) => (ps === 0 ? "—" : ps),
      sorter: (a: Guest, b: Guest) => (a.party_size ?? 0) - (b.party_size ?? 0),
    },
    {
      title: t("guestList.rsvpStatus", "RSVP"),
      dataIndex: "rsvp_status",
      key: "status",
      width: 110,
      render: (status: string) => {
        const label = formatStatusLabel(status);
        const color = statusColor(status);
        return <Tag color={color}>{label}</Tag>;
      },
      filters: Object.keys(STATUS_LABELS).map((k) => ({
        text: STATUS_LABELS[k],
        value: k,
      })),
      filteredValue:
        filters?.status && filters.status !== "all"
          ? Array.isArray(filters.status)
            ? filters.status
            : [filters.status]
          : null,
      onFilter: (value, record: Guest) => record.rsvp_status === value,
      sorter: (a: Guest, b: Guest) => {
        const order: Record<string, number> = {
          attending: 0,
          maybe: 1,
          pending: 2,
          not_attending: 3,
        };
        return (order[a.rsvp_status] ?? 99) - (order[b.rsvp_status] ?? 99);
      },
    },
    {
      title: t("guestList.group", "Group"),
      dataIndex: "relation_id",
      key: "group",
      width: 130,
      render: (rid: string) => {
        const rel = relations?.find((r) => r.relation_id === rid);
        return <Tag color="gold">{rel?.name ?? "—"}</Tag>;
      },
      filters: (relations || []).map((r) => ({
        text: r.name,
        value: r.relation_id,
      })),
      filteredValue: filters?.relation_id
        ? Array.isArray(filters.relation_id)
          ? filters.relation_id
          : [filters.relation_id]
        : null,
      onFilter: (value, record: Guest) => record.relation_id === value,
      sorter: (a: Guest, b: Guest) => {
        const ra =
          relations?.find((r) => r.relation_id === a.relation_id)?.name ?? "";
        const rb =
          relations?.find((r) => r.relation_id === b.relation_id)?.name ?? "";
        return ra.localeCompare(rb);
      },
    },
    {
      title: t("guestList.specials", "Specials"),
      dataIndex: "dietary_restrictions",
      key: "specials",
      width: 170,
      render: (_: any, record: Guest) => (
        <Space>
          {(record.dietary_restrictions || []).map((d) => (
            <Tag key={`diet-${d}`} color="green">
              {d}
            </Tag>
          ))}
          {record.accesability_needs && (
            <Tag key={`acc-${record.accesability_needs}`} color="red">
              {record.accesability_needs}
            </Tag>
          )}
        </Space>
      ),
      filters: specialOptions.map((d) => ({ text: d, value: d })),
      filteredValue:
        filters?.specials && filters.specials.length > 0
          ? filters.specials
          : null,
      onFilter: (value, record: Guest) =>
        (record.dietary_restrictions || []).includes(String(value)) ||
        record.accesability_needs === value,
    },
    {
      title: t("guestList.contact", "Contact"),
      dataIndex: "email",
      key: "contact",
      width: 180,
      ellipsis: true,
      render: (_: any, record: Guest) => {
        const p = record.phone || "";
        const inferredCountry =
          record.country ||
          (/^\+?52/.test(p) || /^52\d{8,}$/.test(p) ? "MX" : undefined);
        return (
          <Space orientation="vertical">
            <div>{record.email}</div>
            <div>{formatPhone(p, inferredCountry, countryCodes)} </div>
          </Space>
        );
      },
      // Contact uses a search input rather than fixed choices; map to parent `query`
      filteredValue: filters?.query ? [filters.query] : null,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t("guestList.searchContact", "Search contact")}
            value={selectedKeys[0] as string}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                onFiltersChange?.({ query: String(selectedKeys[0] ?? "") });
              }}
              size="small"
            >
              {t("guestList.search", "Search")}
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                confirm();
                onFiltersChange?.({ query: undefined });
              }}
              size="small"
            >
              {t("guestList.reset", "Reset")}
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record: Guest) => {
        const q = String(value).toLowerCase();
        return (
          (record.email || "").toLowerCase().includes(q) ||
          (record.phone || "").toLowerCase().includes(q)
        );
      },
      sorter: (a: Guest, b: Guest) =>
        (a.email ?? "").localeCompare(b.email ?? ""),
    },
    {
      title: t("guestList.sendRSVP", "Send RSVP"),
      dataIndex: "actions",
      key: "actions",
      width: 170,
      render: (_: any, record: Guest) => {
        const mailHref = record.email
          ? `mailto:${record.email}?subject=Invitation&body=Hi%20${encodeURIComponent(record.first_name)}`
          : undefined;
        const rawPhone = record.phone || "";
        const phoneDigits = rawPhone.replaceAll(/[^0-9]/g, "");
        const waHref = phoneDigits
          ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi ${record.first_name},`)}`
          : undefined;

        return (
          <Space size="small">
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={(e) => e.stopPropagation()}
              href={waHref}
              target="_blank"
              disabled={!phoneDigits}
              style={{
                background: waBg,
                borderColor: waBg,
                color: colors.buttonText,
              }}
            >
              {t("guestList.whatsapp", "WhatsApp")}
            </Button>
            <Button
              size="small"
              icon={<MailOutlined />}
              onClick={(e) => e.stopPropagation()}
              href={mailHref}
              disabled={!record.email}
              style={{
                background: emailBg,
                borderColor: emailBg,
                color: colors.buttonText,
              }}
            >
              {t("guestList.email", "Email")}
            </Button>
            {/* Delete moved to its own column */}
          </Space>
        );
      },
    },
    {
      title: "",
      dataIndex: "remove",
      key: "remove",
      width: 50,
      fixed: "right" as const,
      render: (_: any, record: Guest) => (
        <Popconfirm
          title={t("guestList.confirmRemove", "Remove guest?")}
          okText={t("guestList.remove", "Remove")}
          cancelText={t("guestList.cancel", "Cancel")}
          onConfirm={async (e) => {
            e?.stopPropagation?.();
            if (!onRemoveGuest) return;
            try {
              await onRemoveGuest(record.guest_id);
            } catch {
              // parent will show error
            }
          }}
          onCancel={(e) => e?.stopPropagation?.()}
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      ),
    },
  ];
  const handleTableChange = (_: any, tableFilters: Record<string, any>) => {
    if (!onFiltersChange) return;

    const extract = (keys: any): string | string[] | undefined => {
      if (Array.isArray(keys) && keys.length) return keys.map(String);
      if (keys && typeof keys === "string") return keys;
      return undefined;
    };

    const statusVal = extract(tableFilters.rsvp_status ?? tableFilters.status);
    const relationVal = extract(tableFilters.relation_id ?? tableFilters.group);
    const queryVal = extract(
      tableFilters.first_name ??
        tableFilters.guest ??
        tableFilters.email ??
        tableFilters.contact,
    );
    const specialsRaw =
      tableFilters.dietary_restrictions ?? tableFilters.specials;
    const specialsVal =
      Array.isArray(specialsRaw) && specialsRaw.length
        ? specialsRaw.map(String)
        : undefined;

    onFiltersChange({
      status: statusVal ?? "all",
      relation_id: relationVal ?? undefined,
      query: Array.isArray(queryVal)
        ? String(queryVal[0])
        : (queryVal as string | undefined),
      specials: specialsVal,
    });
  };

  return (
    <Table<Guest>
      columns={columns}
      dataSource={guests}
      rowKey="guest_id"
      pagination={false}
      onChange={handleTableChange}
      size="small"
      scroll={{ x: "max-content" }}
    />
  );
}

