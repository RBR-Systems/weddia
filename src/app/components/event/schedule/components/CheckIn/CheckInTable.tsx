"use client";

import React, { useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarFilled,
  EnvironmentOutlined,
  UndoOutlined,
  LoginOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import {
  CheckInGuest,
} from "../../models/check-in-types";
import { formatPhone } from "@/utils/formatters";
import styles from "./CheckIn.module.css";

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
    let result = [...guests];
    // Exclude "not_attending" guests from the check-in view
    result = result.filter((g) => g.rsvp_status !== "not_attending");

    // Search
    const q = (filters.query || "").trim().toLowerCase();
    if (q) {
      result = result.filter((g) => {
        const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
        const phone = (g.phone || "").toLowerCase();
        const tableId = (g.table_id || "").toLowerCase();
        return fullName.includes(q) || phone.includes(q) || tableId.includes(q);
      });
    }

    // Status filter (from card clicks or column filter) — supports arrays
    if (filters.statusFilter && filters.statusFilter !== "all") {
      const statuses = Array.isArray(filters.statusFilter)
        ? filters.statusFilter
        : [filters.statusFilter];
      if (statuses.length > 0) {
        result = result.filter((g) => {
          return statuses.some((s) => {
            if (s === "checked_in") return g.checked_in;
            if (s === "not_arrived") return !g.checked_in;
            if (s === "special_needs")
              return (
                (g.dietary_restrictions && g.dietary_restrictions.length > 0) ||
                !!g.accesability_needs
              );
            return true;
          });
        });
      }
    }

    // Relation filter — supports arrays
    if (filters.relationFilter) {
      if (Array.isArray(filters.relationFilter)) {
        if (filters.relationFilter.length > 0) {
          result = result.filter((g) =>
            (filters.relationFilter as string[]).includes(g.relation_id || ""),
          );
        }
      } else if (filters.relationFilter !== "all") {
        result = result.filter((g) => g.relation_id === filters.relationFilter);
      }
    }

    // Specials filter (from column)
    if (filters.specialsFilter && filters.specialsFilter.length > 0) {
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

  const formatTime = (isoString: string | null): string => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Collect special values for column filter
  const specialValues = new Set<string>();
  guests.forEach((g) => {
    (g.dietary_restrictions || []).forEach((d) => specialValues.add(d));
    if (g.accesability_needs) specialValues.add(g.accesability_needs);
  });

  const columns: ColumnsType<CheckInGuest> = [
    {
      title: t("checkIn.table.status"),
      dataIndex: "checked_in",
      key: "status",
      width: 120,
      render: (_: boolean, record: CheckInGuest) => {
        if (record.checked_in) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {t("checkIn.status.checkedIn")}
            </Tag>
          );
        }
        if (record.rsvp_status === "attending") {
          return (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              {t("checkIn.status.expected")}
            </Tag>
          );
        }
        if (record.rsvp_status === "maybe") {
          return <Tag color="blue">{t("checkIn.status.maybe")}</Tag>;
        }
        return <Tag>{t("checkIn.status.pending")}</Tag>;
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
      onFilter: (value, record: CheckInGuest) => {
        if (value === "checked_in") return record.checked_in;
        if (value === "not_arrived") return !record.checked_in;
        if (value === "special_needs")
          return (
            (record.dietary_restrictions &&
              record.dietary_restrictions.length > 0) ||
            !!record.accesability_needs
          );
        return true;
      },
      sorter: (a: CheckInGuest, b: CheckInGuest) =>
        Number(a.checked_in) - Number(b.checked_in),
    },
    {
      title: t("checkIn.table.guestName"),
      key: "name",
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
            value={selectedKeys[0]}
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
                onFiltersChange({ query: String(selectedKeys[0] ?? "") });
              }}
              size="small"
            >
              {t("guestList.search", "Search")}
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                confirm();
                onFiltersChange({ query: undefined });
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
      onFilter: (value: any, record: CheckInGuest) =>
        `${record.first_name} ${record.last_name}`
          .toLowerCase()
          .includes(String(value).toLowerCase()),
      render: (_: unknown, record: CheckInGuest) => (
        <div className={styles.guestNameCell}>
          <span>
            {record.first_name} {record.last_name}
          </span>
          {record.is_vip && (
            <Tooltip title={t("checkIn.badges.vip")}>
              <StarFilled className={styles.vipStar} />
            </Tooltip>
          )}
        </div>
      ),
      sorter: (a: CheckInGuest, b: CheckInGuest) =>
        `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`,
        ),
    },
    {
      title: t("checkIn.table.contact"),
      key: "contact",
      responsive: ["md"],
      render: (_: unknown, record: CheckInGuest) => {
        const p = record.phone || "";
        if (!p) return "-";
        const inferredCountry =
          record.country ||
          (/^\+?52/.test(p) || /^52\d{8,}$/.test(p) ? "MX" : undefined);
        return (
          <Space direction="vertical" size={0}>
            {record.email && <div>{record.email}</div>}
            <div>{formatPhone(p, inferredCountry)}</div>
          </Space>
        );
      },
    },
    {
      title: t("checkIn.table.relation"),
      key: "relation",
      responsive: ["lg"],
      render: (_: unknown, record: CheckInGuest) =>
        record.relation_name ? (
          <Tag color="gold">{record.relation_name}</Tag>
        ) : (
          "-"
        ),
      filters: relations.map((r) => ({ text: r.name, value: r.relation_id })),
      filteredValue: filters.relationFilter
        ? Array.isArray(filters.relationFilter)
          ? filters.relationFilter
          : filters.relationFilter === "all"
            ? null
            : [filters.relationFilter]
        : null,
      onFilter: (value, record) => record.relation_id === value,
    },
    {
      title: t("checkIn.table.tableAssignment"),
      key: "table",
      width: 120,
      render: (_: unknown, record: CheckInGuest) =>
        record.table_id ? (
          <div
            className={`${styles.tableCell} ${onNavigateToTable ? styles.tableCellClickable : ""}`}
            onClick={(e) => {
              if (onNavigateToTable && record.table_id) {
                e.stopPropagation();
                onNavigateToTable(record.table_id);
              }
            }}
          >
            <EnvironmentOutlined />
            <span>{record.table_id}</span>
          </div>
        ) : (
          <span style={{ color: "var(--text-color-secondary)" }}>-</span>
        ),
      sorter: (a: CheckInGuest, b: CheckInGuest) =>
        (a.table_id || "").localeCompare(b.table_id || ""),
    },
    {
      title: t("checkIn.table.seat"),
      key: "seat",
      width: 90,
      align: "center",
      render: (_: unknown, record: CheckInGuest) =>
        record.seat_number ? (
          <Tag
            color="default"
            className={onNavigateToTable && record.table_id ? styles.tableCellClickable : ""}
            onClick={(e) => {
              if (onNavigateToTable && record.table_id) {
                e.stopPropagation();
                onNavigateToTable(record.table_id);
              }
            }}
          >
            {t("checkIn.table.seatNumber", { number: record.seat_number })}
          </Tag>
        ) : (
          <span style={{ color: "var(--text-color-secondary)" }}>-</span>
        ),
    },
    {
      title: t("checkIn.table.partySize"),
      key: "partySize",
      width: 80,
      align: "center",
      render: (_: unknown, record: CheckInGuest) =>
        record.checked_in && record.actual_party_size !== null
          ? record.actual_party_size
          : record.party_size,
    },
    {
      title: t("checkIn.table.alerts"),
      key: "alerts",
      width: 160,
      filters: Array.from(specialValues).map((s) => ({ text: s, value: s })),
      filteredValue:
        filters.specialsFilter && filters.specialsFilter.length > 0
          ? filters.specialsFilter
          : null,
      onFilter: (value, record: CheckInGuest) =>
        (record.dietary_restrictions || []).includes(String(value)) ||
        record.accesability_needs === String(value),
      render: (_: unknown, record: CheckInGuest) => {
        const badges = [];
        if (
          record.dietary_restrictions &&
          record.dietary_restrictions.length > 0
        ) {
          badges.push(
            <Tooltip key="diet" title={record.dietary_restrictions.join(", ")}>
              <Tag color="blue" icon={<MedicineBoxOutlined />}>
                {t("checkIn.badges.dietary")}
              </Tag>
            </Tooltip>,
          );
        }
        if (record.accesability_needs) {
          badges.push(
            <Tooltip key="access" title={record.accesability_needs}>
              <Tag color="purple" icon={<AlertOutlined />}>
                {t("checkIn.badges.accessibility")}
              </Tag>
            </Tooltip>,
          );
        }
        if (record.notes) {
          badges.push(
            <Tooltip key="notes" title={record.notes}>
              <Tag color="gold" icon={<FileTextOutlined />}>
                {t("checkIn.badges.notes")}
              </Tag>
            </Tooltip>,
          );
        }
        return badges.length > 0 ? (
          <div className={styles.alertBadges}>{badges}</div>
        ) : null;
      },
    },
    {
      title: t("checkIn.table.checkInTime"),
      key: "checkInTime",
      width: 120,
      responsive: ["md"],
      render: (_: unknown, record: CheckInGuest) => (
        <span className={styles.checkInTimeCell}>
          {formatTime(record.checked_in_at)}
        </span>
      ),
      sorter: (a: CheckInGuest, b: CheckInGuest) => {
        if (!a.checked_in_at && !b.checked_in_at) return 0;
        if (!a.checked_in_at) return 1;
        if (!b.checked_in_at) return -1;
        return (
          new Date(a.checked_in_at).getTime() -
          new Date(b.checked_in_at).getTime()
        );
      },
    },
    {
      title: t("checkIn.table.actions"),
      key: "actions",
      width: 130,
      fixed: "right",
      render: (_: unknown, record: CheckInGuest) =>
        record.checked_in ? (
          <Button
            size="small"
            icon={<UndoOutlined />}
            onClick={() => onUndoCheckIn(record)}
          >
            {t("checkIn.actions.undoCheckIn")}
          </Button>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<LoginOutlined />}
            onClick={() => onCheckIn(record)}
          >
            {t("checkIn.actions.checkIn")}
          </Button>
        ),
    },
  ];

  const handleTableChange = (_: any, tableFilters: Record<string, any>) => {
    const extract = (keys: any): string | string[] | undefined => {
      if (Array.isArray(keys) && keys.length) return keys.map(String);
      if (keys && typeof keys === "string") return keys;
      return undefined;
    };

    const statusVal = extract(tableFilters.status ?? tableFilters.checked_in);
    const relationVal = extract(tableFilters.relation);
    const queryVal = extract(tableFilters.name);
    const specialsRaw = tableFilters.alerts;
    const specialsVal =
      Array.isArray(specialsRaw) && specialsRaw.length
        ? specialsRaw.map(String)
        : undefined;

    onFiltersChange({
      statusFilter: statusVal ?? "all",
      relationFilter: relationVal ?? null,
      query: Array.isArray(queryVal)
        ? String(queryVal[0])
        : (queryVal as string | undefined),
      specialsFilter: specialsVal,
    });
  };

  return (
    <Table
      dataSource={filteredGuests}
      columns={columns}
      rowKey="guest_id"
      size="middle"
      pagination={{ pageSize: 20, showSizeChanger: true }}
      scroll={{ x: 1100 }}
      onChange={handleTableChange}
      rowClassName={(record) =>
        record.checked_in ? styles.checkedInRow : ""
      }
      locale={{
        emptyText: t("checkIn.emptyState"),
      }}
    />
  );
};

export default CheckInTable;
