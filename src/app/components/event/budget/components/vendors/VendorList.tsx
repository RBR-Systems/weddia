"use client";
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  App,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Avatar,
  Typography,
  Row,
  Col,
  Modal,
  Form,
} from "antd";
import {
  PlusOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Card from "@/app/common/Card/card";
import Statistic from "@/app/common/AnimatedStatistic/AnimatedStatistic";
import styles from "./vendor-list.module.css";
import type { ColumnsType } from "antd/es/table";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";

const { Search } = Input;
const { Text } = Typography;

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  total_spent: number;
  expense_count: number;
  status: "active" | "inactive";
}

interface VendorListProps {
  onViewVendor?: (vendor: Vendor) => void;
}

export default function VendorList({ onViewVendor }: VendorListProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { state } = useBudget();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Derive vendors from expenses
  const vendors = useMemo(() => {
    const vendorMap = new Map<string, Vendor>();

    state.expenses.forEach(
      (expense: {
        vendor_name?: string;
        category_id: string;
        amount: number;
      }) => {
        if (expense.vendor_name) {
          const existing = vendorMap.get(expense.vendor_name);
          if (existing) {
            existing.total_spent += expense.amount;
            existing.expense_count += 1;
          } else {
            vendorMap.set(expense.vendor_name, {
              id: expense.vendor_name.toLowerCase().replace(/\s+/g, "_"),
              name: expense.vendor_name,
              category: expense.category_id,
              total_spent: expense.amount,
              expense_count: 1,
              status: "active",
            });
          }
        }
      },
    );

    return Array.from(vendorMap.values());
  }, [state.expenses]);

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalVendorSpending = vendors.reduce(
    (sum, v) => sum + v.total_spent,
    0,
  );

  const columns: ColumnsType<Vendor> = [
    {
      title: t("vendorList.columns.vendor"),
      key: "vendor",
      render: (_, record) => (
        <Space>
          <Avatar className={styles["avatarBlue"]} icon={<ShopOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" className={styles["smallText"]}>
              {record.category}
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
            <Text className={styles["smallText"]}>
              <MailOutlined /> {record.email}
            </Text>
          )}
          {record.phone && (
            <Text className={styles["smallText"]}>
              <PhoneOutlined /> {record.phone}
            </Text>
          )}
          {!record.email && !record.phone && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
    {
      title: t("vendorList.columns.expenses"),
      dataIndex: "expense_count",
      key: "expense_count",
      align: "center",
      sorter: (a, b) => a.expense_count - b.expense_count,
    },
    {
      title: t("vendorList.columns.totalSpent"),
      dataIndex: "total_spent",
      key: "total_spent",
      render: (amount: number) => formatCurrency(amount, state.currency),
      sorter: (a, b) => a.total_spent - b.total_spent,
      align: "right",
    },
    {
      title: t("vendorList.columns.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? t("vendorList.active") : t("vendorList.inactive")}
        </Tag>
      ),
    },
    {
      title: t("vendorList.columns.actions"),
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onViewVendor?.(record)}
        />
      ),
    },
  ];

  const handleAddVendor = async () => {
    try {
      await form.validateFields();
      message.success(t("vendorList.vendorAdded"));
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <>
      <Row gutter={16} className={styles["rowSpacing"]}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title={t("vendorList.totalVendors")} value={vendors.length} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title={t("vendorList.totalVendorSpending")}
              value={totalVendorSpending}
              formatter={(value) =>
                formatCurrency(Number(value), state.currency)
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title={t("vendorList.activeVendors")}
              value={vendors.filter((v) => v.status === "active").length}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t("vendorList.vendorDirectory")}
        extra={
          <Space>
            <Search
              placeholder={t("vendorList.searchPlaceholder")}
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles["searchWidth"]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              {t("vendorList.addVendor")}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredVendors}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: t("vendorList.emptyText"),
          }}
        />
      </Card>

      <Modal
        title={t("vendorList.addVendor")}
        open={modalOpen}
        onOk={handleAddVendor}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t("vendorList.form.vendorName")}
            rules={[{ required: true }]}
          >
            <Input placeholder={t("vendorList.form.vendorNamePlaceholder")} />
          </Form.Item>
          <Form.Item name="contact_name" label={t("vendorList.form.contactPerson")}>
            <Input placeholder={t("vendorList.form.contactPlaceholder")} />
          </Form.Item>
          <Form.Item name="email" label={t("vendorList.form.email")}>
            <Input type="email" placeholder={t("vendorList.form.emailPlaceholder")} />
          </Form.Item>
          <Form.Item name="phone" label={t("vendorList.form.phone")}>
            <Input placeholder={t("vendorList.form.phonePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
