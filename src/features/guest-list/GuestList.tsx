"use client";
import { useEffect, useState } from "react";
import { ReloadOutlined, FileExcelOutlined, UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Row, Col, Button, Modal, Upload, Form, Input, InputNumber, Select, Tag, Space } from "antd";
import { Guest, formatStatusLabel, statusColor } from "./models/guestList.models";
import { formatPhone } from "@/utils/formatters.utils";
import Header from "@/shared/components/Header/Header";
import { useTranslation } from "react-i18next";
import { useEvent } from "@/shared/contexts/EventContext";
import { fetchGuests, fetchRelations, removeGuest as removeGuestService, createGuest } from "./api/guestApi";
import StatsBar from "./components/StatsBar/StatsBar";
import GuestTable from "./components/GuestTable/GuestTable";
import GuestDetailModal from "./components/GuestDetail/GuestDetailModal";


export default function GuestList() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const {
    state: {
      events: { selectedEvent },
    },
  } = useEvent();
  const eventId = (selectedEvent as any)?.id ?? 1;
  const [guests, setGuests] = useState<Guest[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Guest | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();
  const country = Form.useWatch?.("country", form);
  const [countryCodes, setCountryCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    fetch("/data/country-codes.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!mounted) return;
        if (data && typeof data === "object")
          setCountryCodes(data as Record<string, string>);
      })
      .catch(() => {
        if (!mounted) return;
        setCountryCodes({});
      });
    return () => {
      mounted = false;
    };
  }, []);
  const [relations, setRelations] = useState<
    { relation_id: string; name: string }[]
  >([]);
  const [filters, setFilters] = useState<{
    query?: string;
    relation_id?: string | null | string[];
    status?: "all" | string | string[];
    specials?: string[];
  }>({ status: "all" });

  useEffect(() => {
    fetchGuests(eventId)
      .then(setGuests)
      .catch(() => setGuests([]));

    fetchRelations()
      .then(setRelations)
      .catch(() => setRelations([]));
  }, [eventId]);

  const applyFilters = (list: Guest[]) => {
    return list.filter((g) => {
      // status
      if (filters.status && filters.status !== "all") {
        if (Array.isArray(filters.status)) {
          if (!filters.status.includes(g.rsvp_status)) return false;
        } else {
          if (g.rsvp_status !== filters.status) return false;
        }
      }
      // relation
      if (filters.relation_id) {
        if (Array.isArray(filters.relation_id)) {
          if (!filters.relation_id.includes(g.relation_id || "")) return false;
        } else {
          if (g.relation_id !== filters.relation_id) return false;
        }
      }
      // specials
      if (filters.specials && filters.specials.length > 0) {
        const hasDiet = filters.specials.some((s) =>
          (g.dietary_restrictions || []).includes(s),
        );
        const hasAcc = filters.specials.some((s) => g.accesability_needs === s);
        if (!hasDiet && !hasAcc) return false;
      }
      // query
      if (filters.query && filters.query.trim() !== "") {
        const q = filters.query.toLowerCase();
        const inName = `${g.first_name} ${g.last_name}`
          .toLowerCase()
          .includes(q);
        const inEmail = (g.email || "").toLowerCase().includes(q);
        if (!inName && !inEmail) return false;
      }

      return true;
    });
  };

  const filteredGuests = applyFilters(guests);

  const handleRemoveGuest = async (guest_id: string) => {
    try {
      await removeGuestService(guest_id);
      setGuests((prev) => prev.filter((g) => g.guest_id !== guest_id));
      message.success(t("guestList.removed", "Guest removed"));
    } catch (err) {
      console.error(err);
      message.error(t("guestList.removeFailed", "Failed to remove guest"));
    }
  };

  const hasActiveFilters =
    !!filters.query ||
    (!!filters.relation_id &&
      (!Array.isArray(filters.relation_id) ||
        filters.relation_id.length > 0)) ||
    (!!filters.status &&
      filters.status !== "all" &&
      (!Array.isArray(filters.status) || filters.status.length > 0)) ||
    (!!filters.specials && filters.specials.length > 0);

  const escapeCsv = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const handleExport = () => {
    const list = guests;
    const headers = [
      "guest_id",
      "first_name",
      "last_name",
      "email",
      "phone",
      "party_size",
      "relation_id",
      "rsvp_status",
      "dietary_restrictions",
      "accesability_needs",
      "notes",
    ];

    let csv = headers.join(",") + "\n";
    list.forEach((g) => {
      const row = headers.map((h) => {
        if (h === "dietary_restrictions")
          return escapeCsv((g.dietary_restrictions || []).join(","));
        return escapeCsv((g as any)[h]);
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
  };

  function parseCsv(text: string) {
    const rows: string[][] = [];
    let cur = "";
    let row: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (!inQuotes && (ch === "," || ch === "\n" || ch === "\r")) {
        if (ch === ",") {
          row.push(cur);
          cur = "";
        } else if (ch === "\n") {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = "";
        }
        continue;
      }
      cur += ch;
    }
    if (cur !== "" || row.length) {
      row.push(cur);
      rows.push(row);
    }
    return rows;
  }

  const handleFile = (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const rows = parseCsv(text);
        if (!rows.length) throw new Error("Empty CSV");
        const headers = rows[0].map((h) => h.trim());
        const items = rows.slice(1).map((r, idx) => {
          const obj: any = {};
          headers.forEach((h, i) => (obj[h] = r[i] ?? ""));
          const status = obj.rsvp_status || "pending";
          let party = Number(obj.party_size || obj.party || 1) || 1;
          if (String(status).toLowerCase() === "not_attending") party = 0;
          return {
            guest_id: obj.guest_id || `import-${Date.now()}-${idx}`,
            first_name: obj.first_name || obj.first || "",
            last_name: obj.last_name || obj.last || "",
            email: obj.email || undefined,
            phone: obj.phone || undefined,
            relation_id: obj.relation_id || undefined,
            rsvp_status: (String(status) as any) || "pending",
            party_size: party,
            dietary_restrictions: obj.dietary_restrictions
              ? String(obj.dietary_restrictions)
                  .split(/,|;/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
            accesability_needs:
              obj.accesability_needs || obj.accessibility || undefined,
            notes: obj.notes || undefined,
            plus_one: obj.plus_one || null,
          } as Guest;
        });

        setGuests((prev) => [...items, ...prev]);
        message.success(`Imported ${items.length} guests`);
      } catch (err) {
        console.error(err);
        message.error("Failed to import CSV");
      } finally {
        setImporting(false);
        setImportOpen(false);
      }
    };
    reader.onerror = () => {
      message.error("Failed to read file");
      setImporting(false);
    };
    reader.readAsText(file);
    return false; // prevent upload
  };

  return (
    <div>
      <Header name={t("nav.guestList")} align="left" />

      <Row justify="end" style={{ marginBottom: 24 }}>
        <Col style={{ marginRight: 8 }}>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setAddOpen(true)}
            size="middle"
          >
            {t("guestList.addGuest", "Add Guest")}
          </Button>
        </Col>
        <Col style={{ marginRight: 8 }}>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            size="middle"
          >
            {t("guestList.exportCsv", "Export CSV")}
          </Button>
        </Col>
        <Col style={{ marginRight: 8 }}>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportOpen(true)}
            size="middle"
          >
            {t("guestList.importCsv", "Import CSV")}
          </Button>
        </Col>
      </Row>
      <StatsBar
        guests={guests}
        activeStatuses={
          filters.status && filters.status !== "all"
            ? Array.isArray(filters.status)
              ? (filters.status as string[])
              : [filters.status as string]
            : []
        }
        onStatusClick={(s) =>
          setFilters((prev) => {
            const cur = prev.status;
            if (cur === "all" || cur === undefined)
              return { ...prev, status: [s] };
            if (Array.isArray(cur)) {
              const has = cur.includes(s);
              const next = has ? cur.filter((x) => x !== s) : [...cur, s];
              return { ...prev, status: next.length ? next : "all" };
            }
            // cur is a single string
            if (cur === s) return { ...prev, status: "all" };
            return { ...prev, status: [cur, s] };
          })
        }
      />

      {/* Filter tags area: placed below stats and above the table */}
      {hasActiveFilters && (
        <Row style={{ marginBottom: 12 }} align="middle">
          <Col flex="auto">
            <Space wrap>
              {filters.query && (
                <Tag
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    setFilters((prev) => ({ ...prev, query: undefined }));
                  }}
                >
                  {t("guestList.searchTag", "Search")}:{" "}
                  {String(filters.query).slice(0, 40)}
                </Tag>
              )}

              {/* One tag per selected relation */}
              {(() => {
                const rIds = filters.relation_id
                  ? Array.isArray(filters.relation_id)
                    ? filters.relation_id
                    : [filters.relation_id]
                  : [];
                return rIds.map((rid) => (
                  <Tag
                    key={`rel-${rid}`}
                    closable
                    color="gold"
                    onClose={(e) => {
                      e.preventDefault();
                      setFilters((prev) => {
                        const cur = prev.relation_id;
                        if (Array.isArray(cur)) {
                          const next = cur.filter((x) => x !== rid);
                          return {
                            ...prev,
                            relation_id: next.length ? next : null,
                          };
                        }
                        return { ...prev, relation_id: null };
                      });
                    }}
                  >
                    {relations.find((r) => r.relation_id === rid)?.name || rid}
                  </Tag>
                ));
              })()}

              {/* One tag per selected status */}
              {(() => {
                const statuses =
                  filters.status && filters.status !== "all"
                    ? Array.isArray(filters.status)
                      ? filters.status
                      : [filters.status]
                    : [];
                return statuses.map((s) => (
                  <Tag
                    key={`status-${s}`}
                    closable
                    color={statusColor(s)}
                    onClose={(e) => {
                      e.preventDefault();
                      setFilters((prev) => {
                        const cur = prev.status;
                        if (Array.isArray(cur)) {
                          const next = cur.filter((x) => x !== s);
                          return {
                            ...prev,
                            status: next.length ? next : "all",
                          };
                        }
                        return { ...prev, status: "all" };
                      });
                    }}
                  >
                    {formatStatusLabel(s)}
                  </Tag>
                ));
              })()}

              {/* One tag per selected special */}
              {(filters.specials || []).map((sp) => (
                <Tag
                  key={`special-${sp}`}
                  closable
                  color="green"
                  onClose={(e) => {
                    e.preventDefault();
                    setFilters((prev) => {
                      const next = (prev.specials || []).filter(
                        (x) => x !== sp,
                      );
                      return {
                        ...prev,
                        specials: next.length ? next : undefined,
                      };
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
              onClick={() =>
                setFilters({
                  status: "all",
                  relation_id: undefined,
                  query: undefined,
                  specials: undefined,
                })
              }
              size="middle"
              type="primary"
              icon={<ReloadOutlined />}
            >
              {t("guestList.clearFilters", "Clear all Filters")}
            </Button>
          </Col>
        </Row>
      )}

      <GuestTable
        guests={filteredGuests}
        allGuests={guests}
        relations={relations}
        onSelect={(g) => setSelected(g)}
        onRemoveGuest={handleRemoveGuest}
        filters={filters}
        onFiltersChange={(v) => setFilters((prev) => ({ ...prev, ...v }))}
        countryCodes={countryCodes}
      />
      {selected && (
        <GuestDetailModal
          guest={selected}
          relations={relations}
          onClose={() => setSelected(null)}
          countryCodes={countryCodes}
        />
      )}

      <Modal
        open={importOpen}
        title={t("guestList.importGuestsTitle", "Import Guests (CSV)")}
        onCancel={() => setImportOpen(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".csv"
          beforeUpload={handleFile}
          multiple={false}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            {t(
              "guestList.importDragText",
              "Click or drag CSV file to this area to upload",
            )}
          </p>
          <p className="ant-upload-hint">
            {t(
              "guestList.importHint",
              "Accepted columns: first_name,last_name,email,phone,party_size,relation_id,rsvp_status",
            )}
          </p>
        </Upload.Dragger>
      </Modal>
      <Modal
        open={addOpen}
        title={t("guestList.addGuest", "Add Guest")}
        onCancel={() => setAddOpen(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            setAdding(true);
            try {
              const saved = await createGuest(eventId, {
                first_name: values.first_name || "",
                last_name: values.last_name || "",
                email: values.email || undefined,
                phone: values.phone || undefined,
                country: values.country || undefined,
                relation_id: values.relation_id || undefined,
                rsvp_status: (values.rsvp_status as any) || "pending",
                party_size: Number(values.party_size) || 1,
                dietary_restrictions: values.dietary_restrictions
                  ? String(values.dietary_restrictions)
                      .split(/,|;/)
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  : undefined,
                accesability_needs: values.accesability_needs || undefined,
                notes: values.notes || undefined,
                plus_one: null,
              });

              setGuests((prev) => [saved, ...prev]);
              message.success(t("guestList.added", "Guest added"));
              form.resetFields();
              setAddOpen(false);
            } catch (err) {
              console.error(err);
              message.error(t("guestList.addFailed", "Failed to add guest"));
            } finally {
              setAdding(false);
            }
          }}
        >
          <Form.Item
            name="first_name"
            label={t("guestList.firstName", "First name")}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="last_name"
            label={t("guestList.lastName", "Last name")}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={t("guestList.email", "Email")}
            rules={[
              {
                type: "email",
                message: t(
                  "guestList.validEmail",
                  "Please enter a valid email address",
                ),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="country" label={t("guestList.country", "Country")}>
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select country"
            >
              {Object.keys(countryCodes).map((iso) => (
                <Select.Option key={iso} value={iso}>
                  {iso} (+{(countryCodes as any)[iso]})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              {
                validator: (_rule, value) => {
                  if (!value) return Promise.resolve();
                  const s = String(value || "").trim();
                  // allow formatting characters; keep leading + if present
                  const cleaned =
                    (s.startsWith("+") ? "+" : "") + s.replace(/[^0-9]/g, "");
                  const digits = cleaned.startsWith("+")
                    ? cleaned.slice(1)
                    : cleaned;
                  if (!/^[0-9]+$/.test(digits))
                    return Promise.reject(
                      new Error(
                        "Phone must contain only digits (and an optional leading +).",
                      ),
                    );
                  if (digits.length < 7 || digits.length > 15)
                    return Promise.reject(
                      new Error(
                        "Phone number must be between 7 and 15 digits including country code.",
                      ),
                    );
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              placeholder={
                country
                  ? t(
                      "guestList.phonePlaceholder",
                      "Include country code or national number",
                    )
                  : t("guestList.selectCountryFirst", "Select country first")
              }
              disabled={!country}
              onBlur={(e) => {
                const v = e.target.value || "";
                const selectedCountry = form.getFieldValue("country");
                const isMX =
                  /^\+?52/.test(v) ||
                  /^52\d{8,}$/.test(v) ||
                  /^521\d{8,}$/.test(v);
                const countryToUse =
                  selectedCountry || (isMX ? "MX" : undefined);
                form.setFieldsValue({
                  phone: formatPhone(v, countryToUse, countryCodes),
                });
              }}
            />
          </Form.Item>
          <Form.Item
            name="country"
            label={t("guestList.country", "Country")}
            initialValue="US"
          >
            <Select showSearch optionFilterProp="children">
              {Object.keys(countryCodes).map((iso) => (
                <Select.Option key={iso} value={iso}>
                  {iso} (+{(countryCodes as any)[iso]})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="party_size"
            label={t("guestList.partySize", "Party size")}
            initialValue={1}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="relation_id"
            label={t("guestList.relation", "Relation")}
          >
            <Select allowClear>
              {relations.map((r) => (
                <Select.Option key={r.relation_id} value={r.relation_id}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="rsvp_status"
            label={t("guestList.rsvp", "RSVP")}
            initialValue="pending"
          >
            <Select>
              <Select.Option value="pending">
                {t("guestList.pending", "Pending")}
              </Select.Option>
              <Select.Option value="attending">
                {t("guestList.attending", "Attending")}
              </Select.Option>
              <Select.Option value="maybe">
                {t("guestList.maybe", "Maybe")}
              </Select.Option>
              <Select.Option value="not_attending">
                {t("guestList.notAttending", "Not attending")}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dietary_restrictions"
            label={t("guestList.dietaryRestrictions", "Dietary restrictions")}
          >
            <Input
              placeholder={t("guestList.commaSeparated", "Comma separated")}
            />
          </Form.Item>
          <Form.Item
            name="accesability_needs"
            label={t("guestList.accessibilityNeeds", "Accessibility needs")}
          >
            <Input />
          </Form.Item>
          <Form.Item name="notes" label={t("guestList.notes", "Notes")}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <div style={{ textAlign: "right" }}>
              <Button
                onClick={() => setAddOpen(false)}
                style={{ marginRight: 8 }}
              >
                {t("guestList.cancel", "Cancel")}
              </Button>
              <Button type="primary" htmlType="submit" loading={adding}>
                {t("guestList.add", "Add")}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

