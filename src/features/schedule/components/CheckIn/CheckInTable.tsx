"use client";
import React, { useMemo } from "react";
import { Table, Tag, Button, Space, Input, Tooltip, Avatar, Badge } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, StarFilled, EnvironmentOutlined, UndoOutlined, LoginOutlined, MedicineBoxOutlined, AlertOutlined, FileTextOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { CheckInGuest } from "../../models/checkIn.models";
import styles from "./CheckIn.module.css";
import getKeyboardActivationProps from "@/shared/utils/keyboardActivation";

export interface CheckInFilters {
  query?: string;
  statusFilter?: "all" | string | string[];
  relationFilter?: string | null | string[];
  specialsFilter?: string[];
}

interface CheckInTableProps {
  guests: CheckInGuest[];
  relations: { relation_id: string; name: string }[];
  filters: CheckInFilters;
  onFiltersChange: (filters: Partial<CheckInFilters>) => void;
  onCheckIn: (guest: CheckInGuest) => void;
  onUndoCheckIn: (guest: CheckInGuest) => void;
  onNavigateToTable?: (tableId: string) => void;
}

const CheckInTable: React.FC<CheckInTableProps> = ({
  guests,
  relations,
  filters,
  onFiltersChange,
  onCheckIn,
  onUndoCheckIn,
  onNavigateToTable,
}) => {
  const { t } = useTranslation();

  const filteredGuests = useMemo(() => {
    let result = guests.filter((g) => g.rsvp_status !== "not_attending");

    const q = (filters.query || "").trim().toLowerCase();
    if (q) {
      result = result.filter((g) => {
        const name = `${g.first_name} ${g.last_name}`.toLowerCase();
        return (
          name.includes(q) ||
          (g.phone || "").toLowerCase().includes(q) ||
          (g.table_id || "").toLowerCase().includes(q)
        );
      });
    }

    if (filters.statusFilter && filters.statusFilter !== "all") {
      const statuses = Array.isArray(filters.statusFilter)
        ? filters.statusFilter
        : [filters.statusFilter];
      result = result.filter((g) =>
        statuses.some((s) => {
          if (s === "checked_in") return g.checked_in;
          if (s === "not_arrived") return !g.checked_in;
          if (s === "special_needs")
            return (
              (g.dietary_restrictions?.length ?? 0) > 0 ||
              !!g.accesability_needs
            );
          return true;
        }),
      );
    }

    if (filters.relationFilter) {
      const rel = filters.relationFilter;
      if (Array.isArray(rel) && rel.length) {
        result = result.filter((g) => rel.includes(g.relation_id || ""));
      } else if (rel !== "all" && typeof rel === "string") {
        result = result.filter((g) => g.relation_id === rel);
      }
    }

    if (filters.specialsFilter?.length) {
      result = result.filter((g) => {
        const hasDiet = filters.specialsFilter!.some((s) =>
          (g.dietary_restrictions || []).includes(s),
        );
        const hasAcc = filters.specialsFilter!.some(
          (s) => g.accesability_needs === s,
        );
        return hasDiet || hasAcc;
      });
    }

    return result;
  }, [guests, filters]);

  const specialValues = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      (g.dietary_restrictions || []).forEach((d) => set.add(d));
      if (g.accesability_needs) set.add(g.accesability_needs);
    });
    return Array.from(set);
  }, [guests]);

  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: ColumnsType<CheckInGuest> = [
    // ── Status ─────────────────────────────────────────────────────────
    {
      title: t("checkIn.table.status"),
      key: "status",
      width: 110,
      render: (_: any, r: CheckInGuest) => {
        if (r.checked_in)
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {t("checkIn.status.checkedIn")}
            </Tag>
          );
        if (r.rsvp_status === "attending")
          return (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              {t("checkIn.status.expected")}
            </Tag>
          );
        if (r.rsvp_status === "maybe")
          return <Tag color="blue">{t("checkIn.status.maybe")}</Tag>;
        return <Tag color="default">{t("checkIn.status.pending")}</Tag>;
      },
      filters: [
        { text: t("checkIn.filters.checkedIn"), value: "checked_in" },
        { text: t("checkIn.filters.notArrived"), value: "not_arrived" },
        { text: t("checkIn.filters.specialNeeds"), value: "special_needs" },
      ],
      filteredValue:
        filters.statusFilter && filters.statusFilter !== "all"
          ? Array.isArray(filters.statusFilter)
            ? filters.statusFilter
            : [filters.statusFilter]
          : null,
      onFilter: (value, r: CheckInGuest) => {
        if (value === "checked_in") return r.checked_in;
        if (value === "not_arrived") return !r.checked_in;
        if (value === "special_needs")
          return (
            (r.dietary_restrictions?.length ?? 0) > 0 || !!r.accesability_needs
          );
        return true;
      },
      sorter: (a, b) => Number(a.checked_in) - Number(b.checked_in),
    },

    // ── Guest name ──────────────────────────────────────────────────────
    {
      title: t("checkIn.table.guestName"),
      key: "name",
      width: 200,
      ellipsis: true,
      filteredValue: filters.query ? [filters.query] : null,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t("checkIn.search.placeholder")}
            value={selectedKeys[0] as string}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 200, marginBottom: 8, display: "block" }}
            autoFocus
          />
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                confirm();
                onFiltersChange({ query: String(selectedKeys[0] ?? "") });
              }}
            >
              {t("guestList.search", "Search")}
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                confirm();
                onFiltersChange({ query: undefined });
              }}
            >
              {t("guestList.reset", "Reset")}
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined
          style={{ color: filtered ? "var(--primary)" : undefined }}
        />
      ),
      onFilter: (value, r: CheckInGuest) =>
        `${r.first_name} ${r.last_name}`
          .toLowerCase()
          .includes(String(value).toLowerCase()),
      render: (_: any, r: CheckInGuest) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            size={28}
            style={{
              background: "var(--primary)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {r.first_name?.[0]}
            {r.last_name?.[0]}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.3,
              }}
            >
              {r.first_name} {r.last_name}
              {r.is_vip && (
                <Tooltip title={t("checkIn.badges.vip")}>
                  <StarFilled
                    style={{ color: "#f5a623", marginLeft: 4, fontSize: 11 }}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) =>
        `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`,
        ),
    },

    // ── Group ───────────────────────────────────────────────────────────
    {
      title: t("checkIn.table.relation"),
      key: "relation",
      width: 130,
      ellipsis: true,
      render: (_: any, r: CheckInGuest) =>
        r.relation_name ? (
          <Tag color="gold" style={{ margin: 0 }}>
            {r.relation_name}
          </Tag>
        ) : (
          <span style={{ color: "var(--text-color-muted)" }}>—</span>
        ),
      filters: relations.map((r) => ({ text: r.name, value: r.relation_id })),
      filteredValue: filters.relationFilter
        ? Array.isArray(filters.relationFilter)
          ? filters.relationFilter
          : filters.relationFilter === "all"
            ? null
            : [filters.relationFilter]
        : null,
      onFilter: (value, r) => r.relation_id === value,
    },

    // ── Party size ──────────────────────────────────────────────────────
    {
      title: t("checkIn.table.partySize"),
      key: "party",
      width: 70,
      align: "center" as const,
      render: (_: any, r: CheckInGuest) => {
        const size =
          r.checked_in && r.actual_party_size !== null
            ? r.actual_party_size
            : r.party_size;
        return (
          <Badge
            count={size}
            color="var(--primary)"
            showZero
            overflowCount={99}
            style={{ fontSize: 11 }}
          />
        );
      },
      sorter: (a, b) => (a.party_size ?? 0) - (b.party_size ?? 0),
    },

    // ── Table + Seat (merged) ───────────────────────────────────────────
    {
      title: t("checkIn.table.tableAssignment"),
      key: "table",
      width: 120,
      render: (_: any, r: CheckInGuest) => {
        if (!r.table_id)
          return <span style={{ color: "var(--text-color-muted)" }}>—</span>;
        const kb = getKeyboardActivationProps(
          onNavigateToTable && r.table_id ? () => onNavigateToTable(r.table_id!) : undefined,
        );
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: onNavigateToTable ? "pointer" : "default",
              color: onNavigateToTable ? "var(--primary)" : undefined,
              fontWeight: 500,
            }}
            onClick={(e) => {
              if (onNavigateToTable && r.table_id) {
                e.stopPropagation();
                onNavigateToTable(r.table_id);
              }
            }}
            {...kb}
          >
            <EnvironmentOutlined style={{ fontSize: 12 }} />
            <span>{r.table_id}</span>
            {r.seat_number != null && (
              <Tag style={{ margin: 0, fontSize: 11 }} color="default">
                #{r.seat_number}
              </Tag>
            )}
          </div>
        );
      },
      sorter: (a, b) => (a.table_id || "").localeCompare(b.table_id || ""),
    },

    // ── Alerts ──────────────────────────────────────────────────────────
    {
      title: t("checkIn.table.alerts"),
      key: "alerts",
      width: 110,
      filters: specialValues.map((s) => ({ text: s, value: s })),
      filteredValue: filters.specialsFilter?.length
        ? filters.specialsFilter
        : null,
      onFilter: (value, r: CheckInGuest) =>
        (r.dietary_restrictions || []).includes(String(value)) ||
        r.accesability_needs === String(value),
      render: (_: any, r: CheckInGuest) => {
        const icons = [];
        if ((r.dietary_restrictions?.length ?? 0) > 0) {
          icons.push(
            <Tooltip key="diet" title={r.dietary_restrictions!.join(", ")}>
              <Tag
                color="blue"
                icon={<MedicineBoxOutlined />}
                style={{ margin: 0, cursor: "default" }}
              />
            </Tooltip>,
          );
        }
        if (r.accesability_needs) {
          icons.push(
            <Tooltip key="acc" title={r.accesability_needs}>
              <Tag
                color="purple"
                icon={<AlertOutlined />}
                style={{ margin: 0, cursor: "default" }}
              />
            </Tooltip>,
          );
        }
        if (r.notes) {
          icons.push(
            <Tooltip key="notes" title={r.notes}>
              <Tag
                color="gold"
                icon={<FileTextOutlined />}
                style={{ margin: 0, cursor: "default" }}
              />
            </Tooltip>,
          );
        }
        return icons.length > 0 ? <Space size={4}>{icons}</Space> : null;
      },
    },

    // ── Check-in time ───────────────────────────────────────────────────
    {
      title: t("checkIn.table.checkInTime"),
      key: "checkInTime",
      width: 90,
      align: "center" as const,
      render: (_: any, r: CheckInGuest) => (
        <span
          style={{
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
            color: r.checked_in_at
              ? "var(--text-color)"
              : "var(--text-color-muted)",
          }}
        >
          {formatTime(r.checked_in_at)}
        </span>
      ),
      sorter: (a, b) => {
        if (!a.checked_in_at && !b.checked_in_at) return 0;
        if (!a.checked_in_at) return 1;
        if (!b.checked_in_at) return -1;
        return (
          new Date(a.checked_in_at).getTime() -
          new Date(b.checked_in_at).getTime()
        );
      },
    },

    // ── Actions ─────────────────────────────────────────────────────────
    {
      title: "",
      key: "actions",
      width: 60,
      fixed: "right" as const,
      render: (_: any, r: CheckInGuest) =>
        r.checked_in ? (
          <Tooltip title={t("checkIn.actions.undoCheckIn")}>
            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={() => onUndoCheckIn(r)}
            />
          </Tooltip>
        ) : (
          <Tooltip title={t("checkIn.actions.checkIn")}>
            <Button
              type="primary"
              size="small"
              icon={<LoginOutlined />}
              onClick={() => onCheckIn(r)}
            />
          </Tooltip>
        ),
    },
  ];

  const handleTableChange = (_: any, tableFilters: Record<string, any>) => {
    const extract = (keys: any) => {
      if (Array.isArray(keys) && keys.length) return keys.map(String);
      if (keys && typeof keys === "string") return keys;
      return undefined;
    };
    onFiltersChange({
      statusFilter:
        extract(tableFilters.status ?? tableFilters.checked_in) ?? "all",
      relationFilter: extract(tableFilters.relation) ?? null,
      query: (() => {
        const v = extract(tableFilters.name);
        return Array.isArray(v) ? v[0] : v;
      })(),
      specialsFilter: (() => {
        const raw = tableFilters.alerts;
        return Array.isArray(raw) && raw.length ? raw.map(String) : undefined;
      })(),
    });
  };

  return (
    <Table
      dataSource={filteredGuests}
      columns={columns}
      rowKey="guest_id"
      size="small"
      pagination={{ pageSize: 20, showSizeChanger: false }}
      scroll={{ x: "max-content" }}
      onChange={handleTableChange}
      rowClassName={(r) => (r.checked_in ? styles.checkedInRow : "")}
      locale={{ emptyText: t("checkIn.emptyState") }}
    />
  );
};

export default CheckInTable;

