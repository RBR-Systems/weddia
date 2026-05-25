"use client";
import React, { useState } from "react";
import { ReloadOutlined, FileExcelOutlined, UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { Row, Col, Button, Tag, Space } from "antd";
import { formatStatusLabel, statusColor } from "./models/guestList.models";
import Header from "@/shared/components/Header/Header";
import { useTranslation } from "react-i18next";
import { useEvent } from "@/shared/contexts/EventContext";
import StatsBar from "./components/StatsBar/StatsBar";
import GuestTable from "./components/GuestTable/GuestTable";
import GuestDetailModal from "./components/GuestDetail/GuestDetailModal";
import AddGuestModal from "./components/AddGuestModal/AddGuestModal";
import ImportGuestModal from "./components/ImportGuestModal/ImportGuestModal";
import { useGuestImport } from "./hooks/useGuestImport";
import { useGuestData } from "./hooks/useGuestData";
import { useGuestFilters } from "./hooks/useGuestFilters";

export default function GuestList() {
  const { t } = useTranslation();
  const { state: { events: { selectedEvent } } } = useEvent();
  const eventId = selectedEvent?.id ?? 1;

  const { guests, setGuests, relations, countryCodes, handleUpdateRsvp, handleRemoveGuest, handleAddGuest, handleExport } = useGuestData(eventId);
  const {
    filters, setFilters, filteredGuests, hasActiveFilters,
    relationIds, activeStatusList,
    handleRemoveQueryFilter, handleRemoveRelationFilter, handleRemoveStatusFilter,
    handleRemoveSpecialFilter, handleClearAllFilters, handleStatusClick,
  } = useGuestFilters(guests);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedGuest = selectedId ? (guests.find((g) => g.guest_id === selectedId) ?? null) : null;
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { handleFile } = useGuestImport({
    onImported: (imported) => setGuests((prev) => [...imported, ...prev]),
    onClose: () => setImportOpen(false),
  });

  return (
    <div>
      <Header name={t("nav.guestList")} align="left" />

      <Row justify="end" style={{ marginBottom: 24 }}>
        <Col style={{ marginRight: 8 }}>
          <Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>{t("guestList.addGuest", "Add Guest")}</Button>
        </Col>
        <Col style={{ marginRight: 8 }}>
          <Button icon={<FileExcelOutlined />} onClick={handleExport}>{t("guestList.exportCsv", "Export CSV")}</Button>
        </Col>
        <Col style={{ marginRight: 8 }}>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>{t("guestList.importCsv", "Import CSV")}</Button>
        </Col>
      </Row>

      <StatsBar guests={guests} activeStatuses={activeStatusList} onStatusClick={handleStatusClick} />

      {hasActiveFilters && (
        <Row style={{ marginBottom: 12 }} align="middle">
          <Col flex="auto">
            <Space wrap>
              {filters.query && (
                <Tag closable onClose={(e) => { e.preventDefault(); handleRemoveQueryFilter(); }}>
                  {t("guestList.searchTag", "Search")}: {String(filters.query).slice(0, 40)}
                </Tag>
              )}
              {relationIds.map((rid) => (
                <Tag key={`rel-${rid}`} closable color="gold" onClose={(e) => { e.preventDefault(); handleRemoveRelationFilter(rid); }}>
                  {relations.find((r) => r.relation_id === rid)?.name || rid}
                </Tag>
              ))}
              {activeStatusList.map((s) => (
                <Tag key={`status-${s}`} closable color={statusColor(s)} onClose={(e) => { e.preventDefault(); handleRemoveStatusFilter(s); }}>
                  {formatStatusLabel(s)}
                </Tag>
              ))}
              {(filters.specials || []).map((sp) => (
                <Tag key={`special-${sp}`} closable color="green" onClose={(e) => { e.preventDefault(); handleRemoveSpecialFilter(sp); }}>
                  {sp}
                </Tag>
              ))}
            </Space>
          </Col>
          <Col>
            <Button onClick={handleClearAllFilters} type="primary" icon={<ReloadOutlined />}>
              {t("guestList.clearFilters", "Clear all Filters")}
            </Button>
          </Col>
        </Row>
      )}

      <GuestTable
        guests={filteredGuests}
        allGuests={guests}
        relations={relations}
        onSelect={(g) => setSelectedId(g.guest_id)}
        onRemoveGuest={handleRemoveGuest}
        filters={filters}
        onFiltersChange={(v) => setFilters((prev) => ({ ...prev, ...v }))}
        countryCodes={countryCodes}
      />

      {selectedGuest && (
        <GuestDetailModal
          guest={selectedGuest}
          event={selectedEvent ?? undefined}
          relations={relations}
          onClose={() => setSelectedId(null)}
          onUpdateRsvp={handleUpdateRsvp}
          countryCodes={countryCodes}
        />
      )}

      <ImportGuestModal open={importOpen} onClose={() => setImportOpen(false)} onFile={handleFile} />

      <AddGuestModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        relations={relations}
        countryCodes={countryCodes}
        onSubmit={handleAddGuest}
      />
    </div>
  );
}
