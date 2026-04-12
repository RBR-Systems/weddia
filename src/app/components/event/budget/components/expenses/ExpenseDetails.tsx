"use client";
import React from "react";
import {
  Drawer,
  Descriptions,
  Tag,
  Typography,
  Space,
  Divider,
  Button,
  Image,
  Empty,
  Timeline,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useBudget } from "../../contexts/BudgetContext";
import { getPaymentStatus } from "../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../types/budget.types";
import CategoryTag from "../shared/CategoryTag";
import styles from "./ExpenseDetails.module.css";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface ExpenseDetailsProps {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
}

export default function ExpenseDetails({
  expense,
  open,
  onClose,
  onEdit,
  onDelete,
}: ExpenseDetailsProps) {
  const { state } = useBudget();
  const { t } = useTranslation();
  const PAYMENT_STATUS = getPaymentStatus();

  if (!expense) return null;

  const category = state.categories.find(
    (c: { id: string }) => c.id === expense.category_id,
  );

  const getStatusTag = (status: PaymentStatus) => {
    const config = Object.values(PAYMENT_STATUS).find(
      (s) => s.value === status,
    );
    return <Tag color={config?.color}>{config?.label}</Tag>;
  };

  return (
    <Drawer
      title={
        <Space>
          <span>{t("expenseDetails.title")}</span>
          {getStatusTag(expense.payment_status)}
        </Space>
      }
      placement="right"
      style={{ width: 480 }}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit?.(expense)}>
            {t("common.edit")}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              onDelete?.(expense.expense_id);
              onClose();
            }}
          >
            {t("common.delete")}
          </Button>
        </Space>
      }
    >
      <Space orientation="vertical" className={styles.fullWidth} size="large">
        <div>
          <Title level={4} className={styles.expenseDescription}>
            {expense.description}
          </Title>
          <Title level={2} className={styles.expenseAmount}>
            {formatCurrency(expense.amount, state.currency)}
          </Title>
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t("common.category")}> 
            <CategoryTag color={category?.color}> 
              {category?.name || expense.category_id} 
            </CategoryTag> 
          </Descriptions.Item> 
          <Descriptions.Item label={t("common.vendor")}> 
            {expense.vendor_name || t("common.notSpecified")} 
          </Descriptions.Item> 
          <Descriptions.Item label={t("expenseModal.methodOfPayment")}> 
            {expense.methodOfPayment || t("common.notSpecified")}
          </Descriptions.Item>
          <Descriptions.Item label={t("common.date")}> 
            {formatDate(expense.expense_date)} 
          </Descriptions.Item> 
          <Descriptions.Item label={t("expenseModal.paymentStatus")}> 
            {getStatusTag(expense.payment_status)} 
          </Descriptions.Item> 
        </Descriptions>

        <Divider >{t("expenseDetails.receipts")}</Divider>

        {expense.receipt_urls && expense.receipt_urls.length > 0 ? (
          <Image.PreviewGroup>
            <Space wrap>
              {expense.receipt_urls.map((url, index) => (
                <Image
                  key={index}
                  width={100}
                  height={100}
                  src={url}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9444"
                  style={{ objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <Empty
            image={
              <FileImageOutlined className={styles.emptyIcon} />
            }
            description={t("expenseDetails.noReceipts")}
          />
        )}

        <Divider >{t("expenseDetails.activity")}</Divider>

        <Timeline
          items={[
            {
              color: "green",
              content: t("expenseDetails.expenseCreatedOn", { date: formatDate(expense.expense_date) }),
            },
            {
              color: expense.payment_status === "paid" ? "green" : "gray",
              content:
                expense.payment_status === "paid"
                  ? t("expenseDetails.paymentCompleted")
                  : t("expenseDetails.awaitingPayment"),
            },
          ]}
        />
      </Space>
    </Drawer>
  );
}
