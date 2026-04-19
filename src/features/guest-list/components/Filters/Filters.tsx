"use client";

import { useTranslation } from "react-i18next";
import { Input, Select, Segmented, Row, Col, type SelectProps } from "antd";

type StatusOption = "all" | "pending" | "attending" | "maybe" | "not_attending";

interface Relation {
  relation_id: string;
  name: string;
}

interface FiltersProps {
  relations: Relation[];
  value?: {
    query?: string;
    relation_id?: string | null;
    status?: StatusOption;
  };
  onChange?: (v: {
    query?: string;
    relation_id?: string | null;
    status?: StatusOption;
  }) => void;
}

export default function Filters({
  relations,
  value = {},
  onChange,
}: FiltersProps) {
  const { t } = useTranslation();
  const handleQuery = (q: string) => onChange?.({ ...(value || {}), query: q });
  const handleRelation = (rid: string | null) =>
    onChange?.({ ...(value || {}), relation_id: rid });
  const handleStatus = (s: StatusOption | string) =>
    onChange?.({ ...(value || {}), status: s as StatusOption });

  const selectOptions: SelectProps["options"] = [
    { label: t('guestList.allGroups', 'All groups'), value: "" },
    ...relations.map((r) => ({ label: r.name, value: r.relation_id })),
  ];

  return (
    <Row gutter={12} style={{ marginBottom: 12 }}>
      <Col xs={24} md={10} lg={8}>
        <Input.Search
          placeholder={t('guestList.searchPlaceholder', 'Search name or email')}
          allowClear
          onSearch={handleQuery}
          onChange={(e) => handleQuery(e.target.value)}
        />
      </Col>
      <Col xs={24} md={8} lg={8}>
        <Select
          options={selectOptions}
          onChange={(v) => handleRelation(v === "" ? null : String(v))}
          value={value.relation_id ?? ""}
          placeholder={t('guestList.groupPlaceholder', 'Group')}
          allowClear
          style={{ width: "100%" }}
        />
      </Col>
      <Col
        xs={24}
        md={6}
        lg={8}
        style={{ display: "flex", alignItems: "center" }}
      >
        <Segmented
          options={[
            { label: t('guestList.all', 'All'), value: "all" },
            { label: t('guestList.attending', 'Attending'), value: "attending" },
            { label: t('guestList.pending', 'Pending'), value: "pending" },
            { label: t('guestList.maybe', 'Maybe'), value: "maybe" },
            { label: t('guestList.notAttending', 'Not Attending'), value: "not_attending" },
          ]}
          value={value.status ?? "all"}
          onChange={handleStatus}
        />
      </Col>
    </Row>
  );
}

