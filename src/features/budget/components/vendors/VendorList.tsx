"use client";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { App, Table, Button, Input, Space, Tag, Avatar, Typography, Row, Col, Modal, Form, Select } from "antd";
import { PlusOutlined, ShopOutlined, PhoneOutlined, MailOutlined, EyeOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { BudgetService } from "../../api/budgetApi";
import expenseStyles from "../ExpenseModal.module.css";
import Card from "@/shared/components/Card/Card";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import styles from "./vendor-list.module.css";
import type { ColumnsType } from "antd/es/table";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters.utils";
import type { Vendor } from "../../models/budget.models";

const { Search } = Input;
const { Text } = Typography;

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
            existing.total_spent = (existing.total_spent ?? 0) + expense.amount;
            existing.expense_count = (existing.expense_count ?? 0) + 1;
          } else {
            vendorMap.set(expense.vendor_name, {
              vendor_id: expense.vendor_name.toLowerCase().replaceAll(/\s+/g, "_"),
              name: expense.vendor_name,
              category: expense.category_id,
              total_spent: expense.amount,
              expense_count: 1,
              is_active: true,
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
    (sum, v) => sum + (v.total_spent ?? 0),
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
      sorter: (a, b) => (a.expense_count ?? 0) - (b.expense_count ?? 0),
    },
    {
      title: t("vendorList.columns.totalSpent"),
      dataIndex: "total_spent",
      key: "total_spent",
      render: (amount: number) => formatCurrency(amount, state.currency),
      sorter: (a, b) => (a.total_spent ?? 0) - (b.total_spent ?? 0),
      align: "right",
    },
    {
      title: t("vendorList.columns.status"),
      dataIndex: "status",
      key: "status",
      render: (_: unknown, record: Vendor) => (
        <Tag color={record.is_active !== false ? "green" : "default"}>
          {record.is_active !== false ? t("vendorList.active") : t("vendorList.inactive")}
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
      const values = await form.validateFields();
      await BudgetService.createVendor({
        vendorName:    values.name,
        category:      values.category ?? "",
        contactPerson: values.contact_name,
        email:         values.email,
        mobilePhone:   values.phone,
        address:       values.address,
        notes:         values.notes,
      });
      message.success(t("vendorList.form.vendorCreated"));
      setModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return; // validation error, stay open
      message.error(t("vendorList.form.vendorCreateFailed"));
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
              value={vendors.filter((v) => v.is_active !== false).length}
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
          rowKey="vendor_id"
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
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText={t("common.create")}
        cancelText={t("common.cancel")}
        width={520}
        forceRender
        destroyOnHidden={false}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 4 }}>

          {/* ── Hero: vendor name ── */}
          <div className={expenseStyles.amountSection}>
            <Form.Item
              name="name"
              label={t("vendorList.form.vendorName")}
              rules={[{ required: true, message: t("vendorList.form.vendorName") }]}
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder={t("vendorList.form.vendorNamePlaceholder")}
                style={{
                  background: "transparent", border: "none",
                  borderBottom: "1.5px solid rgba(255,255,255,0.38)",
                  borderRadius: 0, boxShadow: "none",
                  fontSize: 22, fontWeight: 700, color: "#fff",
                  paddingLeft: 0,
                }}
              />
            </Form.Item>
          </div>

          {/* ── Category ── */}
          <div className={expenseStyles.paymentSection} style={{ marginBottom: 12 }}>
            <p className={expenseStyles.sectionLabel}>{t("vendorList.form.category")}</p>
            <Form.Item name="category" noStyle>
              <Select
                placeholder={t("vendorList.form.categoryPlaceholder")}
                style={{ width: "100%" }}
                options={[
                  "Catering", "Florals", "Photography", "Videography",
                  "Music / DJ", "Venue", "Decoration", "Transportation",
                  "Hair & Makeup", "Cake", "Other",
                ].map((c) => ({ label: c, value: c }))}
              />
            </Form.Item>
          </div>

          {/* ── Contact ── */}
          <div className={expenseStyles.paymentSection} style={{ marginBottom: 12 }}>
            <p className={expenseStyles.sectionLabel}>
              <UserOutlined style={{ marginRight: 6 }} />
              {t("vendorList.form.contactPerson")}
            </p>
            <div className={expenseStyles.twoCol}>
              <Form.Item name="contact_name" label={t("vendorList.form.contactPerson")} style={{ marginBottom: 0 }}>
                <Input placeholder={t("vendorList.form.contactPlaceholder")} />
              </Form.Item>
              <Form.Item name="phone" label={t("vendorList.form.phone")} style={{ marginBottom: 0 }}>
                <Input placeholder={t("vendorList.form.phonePlaceholder")} prefix={<PhoneOutlined />} />
              </Form.Item>
            </div>
            <Form.Item name="email" label={t("vendorList.form.email")} style={{ marginBottom: 0, marginTop: 10 }}>
              <Input type="email" placeholder={t("vendorList.form.emailPlaceholder")} prefix={<MailOutlined />} />
            </Form.Item>
          </div>

          {/* ── Address & Notes ── */}
          <div className={expenseStyles.paymentSection}>
            <p className={expenseStyles.sectionLabel}>
              <EnvironmentOutlined style={{ marginRight: 6 }} />
              {t("vendorList.form.address")}
            </p>
            <Form.Item name="address" label={t("vendorList.form.address")} style={{ marginBottom: 10 }}>
              <Input placeholder={t("vendorList.form.addressPlaceholder")} />
            </Form.Item>
            <Form.Item name="notes" label={t("vendorList.form.notes")} style={{ marginBottom: 0 }}>
              <Input.TextArea
                rows={2}
                placeholder={t("vendorList.form.notesPlaceholder")}
              />
            </Form.Item>
          </div>

        </Form>
      </Modal>
    </>
  );
}


