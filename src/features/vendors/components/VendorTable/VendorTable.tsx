"use client";
import { Table, Button, Input, Tag, Avatar, Space, Typography } from "antd";
import { PlusOutlined, ShopOutlined, PhoneOutlined, MailOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import type { Vendor } from "@/shared/models/vendor.models";
import Card from "@/shared/components/Card/Card";
import { VENDOR_CATALOG_PAGE_SIZE } from "../../constants/vendor.constants";
import styles from "./VendorTable.module.css";

const { Search } = Input;
const { Text } = Typography;

interface VendorTableProps {
  vendors: Vendor[];
  isLoading: boolean;
  searchTerm: string;
  onSearch: (term: string) => void;
  onAdd: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => Promise<void>;
}

export const VendorTable = ({ vendors, isLoading, searchTerm, onSearch, onAdd, onEdit, onDelete }: VendorTableProps) => {
  const { t } = useTranslation();

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: ColumnsType<Vendor> = [
    {
      title: t("vendorList.columns.vendor"),
      key: "vendor",
      render: (_, record) => (
        <Space>
          <Avatar className={styles.avatarBlue} icon={<ShopOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" className={styles.smallText}>
              {record.category_name || "—"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: t("vendorList.columns.contact"),
      key: "contact",
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          {record.email && (
            <Text className={styles.smallText}><MailOutlined /> {record.email}</Text>
          )}
          {record.phone && (
            <Text className={styles.smallText}><PhoneOutlined /> {record.phone}</Text>
          )}
          {!record.email && !record.phone && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
    {
      title: t("vendorList.columns.status"),
      key: "status",
      render: (_, record) => (
        <Tag color={record.is_active !== false ? "green" : "default"}>
          {record.is_active !== false ? t("vendorList.active") : t("vendorList.inactive")}
        </Tag>
      ),
    },
    {
      title: t("vendorList.columns.actions"),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title={t("vendorCatalog.deleteConfirm")}
            onConfirm={() => onDelete(record)}
            okText={t("common.delete")}
            cancelText={t("common.cancel")}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={t("vendorCatalog.directory")}
      extra={
        <Space>
          <Search
            placeholder={t("vendorList.searchPlaceholder")}
            allowClear
            onSearch={onSearch}
            onChange={(e) => onSearch(e.target.value)}
            className={styles.searchWidth}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            {t("vendorList.addVendor")}
          </Button>
        </Space>
      }
    >
      <Table
        loading={isLoading}
        columns={columns}
        dataSource={filtered}
        rowKey="vendor_id"
        pagination={{ pageSize: VENDOR_CATALOG_PAGE_SIZE }}
        locale={{ emptyText: t("vendorCatalog.emptyText") }}
      />
    </Card>
  );
};
