"use client";
import React, { useCallback, useEffect, useState } from "react";
import { App, Button, Col, Empty, Row, Space, Spin, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useEvent } from "@/shared/contexts/EventContext";
import { CheckInGuest, CheckInStatusFilter } from "../../models/checkIn.models";
import { fetchCheckInData, computeStats } from "../../api/checkInApi";
import CheckInStatsBar from "./CheckInStatsBar";
import CheckInTable, { CheckInFilters } from "./CheckInTable";
import CheckInModal from "./CheckInModal";
import styles from "./CheckIn.module.css";

interface CheckInDashboardProps {
  onNavigateToTable?: (tableId: string) => void;
}

const STATUS_FILTER_LABELS: Record<string, string> = {
  checked_in: "Checked In",
  not_arrived: "Not Arrived",
  special_needs: "Special Needs",
};

const STATUS_FILTER_COLORS: Record<string, string> = {
  checked_in: "green",
  not_arrived: "gold",
  special_needs: "purple",
};

const CheckInDashboard: React.FC<CheckInDashboardProps> = ({ onNavigateToTable }) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { state: { events: { selectedEvent } } } = useEvent();
  const eventId = (selectedEvent as any)?.id ?? 1;

  const [guests, setGuests] = useState<CheckInGuest[]>([]);
  const [relations, setRelations] = useState<
    { relation_id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Unified filters
  const [filters, setFilters] = useState<CheckInFilters>({
    statusFilter: "all",
    relationFilter: null,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<CheckInGuest | null>(null);
  const [actualPartySize, setActualPartySize] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchCheckInData(eventId).then(({ guests, relations }) => {
      setGuests(guests);
      setRelations(relations);
      setLoading(false);
    });
  }, [eventId]);

  const stats = computeStats(guests);

  const handleFiltersChange = useCallback(
    (partial: Partial<CheckInFilters>) => {
      setFilters((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  const handleStatusCardClick = useCallback(
    (filter: CheckInStatusFilter) => {
      setFilters((prev) => {
        const cur = prev.statusFilter;
        // Same toggle-array logic as the guest list
        if (cur === "all" || cur === undefined)
          return { ...prev, statusFilter: [filter] };
        if (Array.isArray(cur)) {
          const has = cur.includes(filter);
          const next = has ? cur.filter((x) => x !== filter) : [...cur, filter];
          return { ...prev, statusFilter: next.length ? next : "all" };
        }
        // cur is a single string
        if (cur === filter) return { ...prev, statusFilter: "all" };
        return { ...prev, statusFilter: [cur, filter] };
      });
    },
    [],
  );

  const clearAllFilters = useCallback(() => {
    setFilters({
      statusFilter: "all",
      relationFilter: null,
      query: undefined,
      specialsFilter: undefined,
    });
  }, []);

  const hasActiveFilters =
    !!filters.query ||
    (!!filters.statusFilter &&
      filters.statusFilter !== "all" &&
      (!Array.isArray(filters.statusFilter) || filters.statusFilter.length > 0)) ||
    (!!filters.relationFilter &&
      (!Array.isArray(filters.relationFilter) || filters.relationFilter.length > 0)) ||
    (!!filters.specialsFilter && filters.specialsFilter.length > 0);

  const handleCheckIn = useCallback((guest: CheckInGuest) => {
    setSelectedGuest(guest);
    setActualPartySize(guest.party_size);
    setModalOpen(true);
  }, []);

  const handleConfirmCheckIn = useCallback(() => {
    if (!selectedGuest) return;

    setGuests((prev) =>
      prev.map((g) =>
        g.guest_id === selectedGuest.guest_id
          ? {
              ...g,
              checked_in: true,
              checked_in_at: new Date().toISOString(),
              actual_party_size: actualPartySize,
            }
          : g
      )
    );

    message.success(
      t("checkIn.messages.checkedInSuccess", {
        name: `${selectedGuest.first_name} ${selectedGuest.last_name}`,
      })
    );

    setModalOpen(false);
    setSelectedGuest(null);
  }, [selectedGuest, actualPartySize, message, t]);

  const handleUndoCheckIn = useCallback(
    (guest: CheckInGuest) => {
      setGuests((prev) =>
        prev.map((g) =>
          g.guest_id === guest.guest_id
            ? {
                ...g,
                checked_in: false,
                checked_in_at: null,
                actual_party_size: null,
              }
            : g
        )
      );

      message.info(
        t("checkIn.messages.checkInUndone", {
          name: `${guest.first_name} ${guest.last_name}`,
        })
      );
    },
    [message, t]
  );

  const handleCancelModal = useCallback(() => {
    setModalOpen(false);
    setSelectedGuest(null);
  }, []);

  if (loading) return <Spin style={{ display: "block", margin: "40px auto" }} />;
  if (!guests.length) return <Empty />;

  return (
    <div>
      {/* Stats — clickable cards for filtering */}
      <CheckInStatsBar
        stats={stats}
        activeStatuses={
          filters.statusFilter && filters.statusFilter !== "all"
            ? Array.isArray(filters.statusFilter)
              ? filters.statusFilter
              : [filters.statusFilter]
            : []
        }
        onStatusClick={handleStatusCardClick}
      />

      {/* Filter tags area */}
      {hasActiveFilters && (
        <Row className={styles.filterTagsRow} align="middle">
          <Col flex="auto">
            <Space wrap>
              {filters.query && (
                <Tag
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    handleFiltersChange({ query: undefined });
                  }}
                >
                  {t("guestList.searchTag", "Search")}: {filters.query.slice(0, 40)}
                </Tag>
              )}

              {/* One tag per selected status */}
              {(() => {
                const statuses =
                  filters.statusFilter && filters.statusFilter !== "all"
                    ? Array.isArray(filters.statusFilter)
                      ? filters.statusFilter
                      : [filters.statusFilter]
                    : [];
                return statuses.map((s) => (
                  <Tag
                    key={`status-${s}`}
                    closable
                    color={STATUS_FILTER_COLORS[s] || "default"}
                    onClose={(e) => {
                      e.preventDefault();
                      setFilters((prev) => {
                        const cur = prev.statusFilter;
                        if (Array.isArray(cur)) {
                          const next = cur.filter((x) => x !== s);
                          return {
                            ...prev,
                            statusFilter: next.length ? next : "all",
                          };
                        }
                        return { ...prev, statusFilter: "all" };
                      });
                    }}
                  >
                    {t(
                      `checkIn.filters.${s === "checked_in" ? "checkedIn" : s === "not_arrived" ? "notArrived" : "specialNeeds"}`,
                      STATUS_FILTER_LABELS[s] || s,
                    )}
                  </Tag>
                ));
              })()}

              {/* One tag per selected relation */}
              {(() => {
                const rIds = filters.relationFilter
                  ? Array.isArray(filters.relationFilter)
                    ? filters.relationFilter
                    : [filters.relationFilter]
                  : [];
                return rIds.map((rid) => (
                  <Tag
                    key={`rel-${rid}`}
                    closable
                    color="gold"
                    onClose={(e) => {
                      e.preventDefault();
                      setFilters((prev) => {
                        const cur = prev.relationFilter;
                        if (Array.isArray(cur)) {
                          const next = cur.filter((x) => x !== rid);
                          return {
                            ...prev,
                            relationFilter: next.length ? next : null,
                          };
                        }
                        return { ...prev, relationFilter: null };
                      });
                    }}
                  >
                    {relations.find((r) => r.relation_id === rid)?.name || rid}
                  </Tag>
                ));
              })()}

              {/* One tag per selected special */}
              {(filters.specialsFilter || []).map((sp) => (
                <Tag
                  key={`special-${sp}`}
                  closable
                  color="green"
                  onClose={(e) => {
                    e.preventDefault();
                    handleFiltersChange({
                      specialsFilter: (filters.specialsFilter || []).filter(
                        (x) => x !== sp,
                      ),
                    });
                  }}
                >
                  {sp}
                </Tag>
              ))}
            </Space>
          </Col>
          <Col>
            <Button
              onClick={clearAllFilters}
              size="middle"
              type="primary"
              icon={<ReloadOutlined />}
            >
              {t("guestList.clearFilters", "Clear all Filters")}
            </Button>
          </Col>
        </Row>
      )}

      {/* Guest Table */}
      <CheckInTable
        guests={guests}
        relations={relations}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onCheckIn={handleCheckIn}
        onUndoCheckIn={handleUndoCheckIn}
        onNavigateToTable={onNavigateToTable}
      />

      {/* Check-In Modal */}
      <CheckInModal
        open={modalOpen}
        guest={selectedGuest}
        actualPartySize={actualPartySize}
        onActualPartySizeChange={setActualPartySize}
        onConfirm={handleConfirmCheckIn}
        onCancel={handleCancelModal}
      />
    </div>
  );
};

export default CheckInDashboard;

