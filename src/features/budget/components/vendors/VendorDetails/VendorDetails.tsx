"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { App, Drawer, Descriptions, Typography, Flex, Space, Divider, Table, Tag, Row, Col, Avatar, Empty, Form, Input, InputNumber, Select, Button, DatePicker } from "antd";
import { ShopOutlined, MailOutlined, PhoneOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Card from "@/shared/components/Card/Card";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency, formatDate, formatInputNumber, parseInputNumber } from "@/shared/utils/formatters.utils";
import { getPaymentStatus, VENDOR_DETAILS_PAGE_SIZE } from "../../../constants/budget.constants";
import type { Expense, PaymentStatus, Vendor, VendorEventStatus } from "../../../models/budget.models";
import vendorStyles from "./VendorDetails.module.css";

const { Title } = Typography;
const { TextArea } = Input;

const VENDOR_DETAILS_PAGINATION = { pageSize: VENDOR_DETAILS_PAGE_SIZE } as const;

const STATUS_OPTIONS: { value: VendorEventStatus; color: string }[] = [
  { value: "active",     color: "processing" },
  { value: "contracted", color: "success"    },
  { value: "cancelled",  color: "error"      },
  { value: "completed",  color: "default"    },
];

interface ContractFormValues {
  contracted_amount: number | undefined;
  status: VendorEventStatus;
  contracted_date: string | undefined;
  notes: string;
}

interface VendorDetailsProps {
  readonly vendor: Vendor | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function VendorDetails({ vendor, open, onClose }: VendorDetailsProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { state, updateVendorEvent } = useBudget();
  const PAYMENT_STATUS = getPaymentStatus();

  const vendorEvent = vendor
    ? state.vendorEvents.find((ve) => ve.vendor_id === vendor.vendor_id)
    : undefined;

  const [contractForm, setContractForm] = useState<ContractFormValues>({
    contracted_amount: vendorEvent?.contracted_amount,
    status:            vendorEvent?.status ?? "active",
    contracted_date:   vendorEvent?.contracted_date,
    notes:             vendorEvent?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContractForm({
      contracted_amount: vendorEvent?.contracted_amount,
      status:            vendorEvent?.status ?? "active",
      contracted_date:   vendorEvent?.contracted_date,
      notes:             vendorEvent?.notes ?? "",
    });
  // reset whenever the selected vendor or its event data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?.vendor_id, vendorEvent?.status, vendorEvent?.contracted_amount]);

  if (!vendor) return null;

  const vendorExpenses = state.expenses.filter((e: Expense) => e.vendor_name === vendor.name);

  const paidAmount = vendorExpenses
    .filter((e: Expense) => e.payment_status === "paid")
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const pendingAmount = vendorExpenses
    .filter((e: Expense) => e.payment_status === "pending")
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const isActive = vendor.is_active ?? true;

  const handleSaveContract = async () => {
    if (!vendorEvent) return;
    setSaving(true);
    try {
      await updateVendorEvent(vendor.vendor_id, {
        contracted_amount: contractForm.contracted_amount,
        status:            contractForm.status,
        contracted_date:   contractForm.contracted_date,
        notes:             contractForm.notes || undefined,
      });
      message.success(t("vendorDetails.contractSaved"));
    } catch {
      message.error(t("vendorDetails.contractSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const expenseColumns = [
    {
      title:     t("vendorDetails.columns.description"),
      dataIndex: "description",
      key:       "description",
    },
    {
      title:     t("vendorDetails.columns.amount"),
      dataIndex: "amount",
      key:       "amount",
      render:    (amount: number) => formatCurrency(amount, state.currency),
    },
    {
      title:     t("vendorDetails.columns.date"),
      dataIndex: "expense_date",
      key:       "expense_date",
      render:    (date: string) => formatDate(date),
    },
    {
      title:     t("vendorDetails.columns.status"),
      dataIndex: "payment_status",
      key:       "payment_status",
      render:    (status: PaymentStatus) => {
        const config = Object.values(PAYMENT_STATUS).find((s) => s.value === status);
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
  ];

  return (
    <Drawer
      title={t("vendorDetails.title")}
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap="large" className={vendorStyles.fullWidth}>
        <Space>
          <Avatar size={64} className={vendorStyles.vendorAvatar} icon={<ShopOutlined />} />
          <div>
            <Title level={4} className={vendorStyles.vendorName}>
              {vendor.name}
            </Title>
            <Tag color={isActive ? "green" : "default"}>
              {isActive ? t("vendorList.active") : t("vendorList.inactive")}
            </Tag>
          </div>
        </Space>

        <Descriptions column={1} size="small">
          {vendor.contact_name && (
            <Descriptions.Item label={t("vendorDetails.contact")}>
              {vendor.contact_name}
            </Descriptions.Item>
          )}
          {vendor.email && (
            <Descriptions.Item label={t("vendorDetails.email")}>
              <MailOutlined /> {vendor.email}
            </Descriptions.Item>
          )}
          {vendor.phone && (
            <Descriptions.Item label={t("vendorDetails.phone")}>
              <PhoneOutlined /> {vendor.phone}
            </Descriptions.Item>
          )}
          <Descriptions.Item label={t("vendorDetails.category")}>
            {vendor.category_name || "—"}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={[16, 16]}>
          {vendorEvent?.contracted_amount != null && (
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title={t("vendorDetails.contractedAmount")}
                  value={vendorEvent.contracted_amount}
                  formatter={(value: number | string) =>
                    formatCurrency(Number(value), state.currency)
                  }
                />
              </Card>
            </Col>
          )}
          <Col span={vendorEvent?.contracted_amount != null ? 12 : 8}>
            <Card size="small">
              <Statistic
                title={t("vendorDetails.totalSpent")}
                value={vendor.total_spent}
                formatter={(value: number | string) =>
                  formatCurrency(Number(value), state.currency)
                }
              />
            </Card>
          </Col>
          <Col span={vendorEvent?.contracted_amount != null ? 12 : 8}>
            <Card size="small">
              <Statistic
                title={t("vendorDetails.paid")}
                value={paidAmount}
                className={vendorStyles.paidValue}
                formatter={(value: number | string) =>
                  formatCurrency(Number(value), state.currency)
                }
              />
            </Card>
          </Col>
          <Col span={vendorEvent?.contracted_amount != null ? 12 : 8}>
            <Card size="small">
              <Statistic
                title={t("vendorDetails.pending")}
                value={pendingAmount}
                className={vendorStyles.pendingValue}
                formatter={(value: number | string) =>
                  formatCurrency(Number(value), state.currency)
                }
              />
            </Card>
          </Col>
        </Row>

        {vendorEvent && (
          <>
            <Divider>{t("vendorDetails.contractSection")}</Divider>
            <Form layout="vertical" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={t("vendorDetails.contractedAmount")}>
                    <InputNumber
                      style={{ width: "100%" }}
                      controls={false}
                      min={0}
                      placeholder="0.00"
                      formatter={(v) => formatInputNumber(v)}
                      parser={parseInputNumber}
                      value={contractForm.contracted_amount}
                      onChange={(val) =>
                        setContractForm((prev) => ({ ...prev, contracted_amount: val ?? undefined }))
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={t("vendorDetails.contractStatus")}>
                    <Select
                      style={{ width: "100%" }}
                      value={contractForm.status}
                      onChange={(val: VendorEventStatus) =>
                        setContractForm((prev) => ({ ...prev, status: val }))
                      }
                      options={STATUS_OPTIONS.map((s) => ({
                        value: s.value,
                        label: (
                          <Tag color={s.color} style={{ margin: 0 }}>
                            {t(`eventVendors.contractStatusValues.${s.value}`)}
                          </Tag>
                        ),
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={t("vendorDetails.contractDate")}>
                    <DatePicker
                      style={{ width: "100%" }}
                      value={contractForm.contracted_date ? dayjs(contractForm.contracted_date) : null}
                      onChange={(date) =>
                        setContractForm((prev) => ({
                          ...prev,
                          contracted_date: date ? date.toISOString() : undefined,
                        }))
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={t("vendorDetails.contractNotes")}>
                    <TextArea
                      value={contractForm.notes}
                      onChange={(e) =>
                        setContractForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Flex justify="flex-end">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={handleSaveContract}
                >
                  {t("vendorDetails.saveContract")}
                </Button>
              </Flex>
            </Form>
          </>
        )}

        <Divider>
          {t("vendorDetails.expenses", { count: vendorExpenses.length })}
        </Divider>

        {vendorExpenses.length > 0 ? (
          <Table
            columns={expenseColumns}
            dataSource={vendorExpenses}
            rowKey="expense_id"
            size="small"
            pagination={VENDOR_DETAILS_PAGINATION}
          />
        ) : (
          <Empty description={t("vendorDetails.noExpenses")} />
        )}
      </Flex>
    </Drawer>
  );
}
