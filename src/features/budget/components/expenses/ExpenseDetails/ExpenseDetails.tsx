"use client";

import { Drawer, Descriptions, Typography, Flex, Space, Divider, Button, Empty, Timeline } from "antd";
import { EditOutlined, DeleteOutlined, FileImageOutlined, LinkOutlined } from "@ant-design/icons";
import { formatCurrency, formatDate } from "@/shared/utils/formatters.utils";
import { useBudget } from "../../../contexts/BudgetContext";
import { getPaymentStatus } from "../../../constants/budget.constants";
import type { Expense } from "../../../models/budget.models";
import CategoryTag from "../../common/CategoryTag/CategoryTag";
import { PaymentStatusTag } from "../../common/PaymentStatusTag/PaymentStatusTag";
import styles from "./ExpenseDetails.module.css";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

interface ExpenseDetailsProps {
  readonly expense: Expense | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onEdit?: (expense: Expense) => void;
  readonly onDelete?: (expenseId: string) => void;
}

export function ExpenseDetails({
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

  return (
    <Drawer
      title={
        <Flex align="center" gap={8}>
          <span>{t("expenseDetails.title")}</span>
          <PaymentStatusTag status={expense.payment_status} />
        </Flex>
      }
      placement="right"
      width={480}
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
      <Flex vertical gap="large" className={styles.fullWidth}>
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
            <PaymentStatusTag status={expense.payment_status} />
          </Descriptions.Item>
        </Descriptions>

        <Divider>{t("expenseDetails.receipts")}</Divider>

        {expense.receipt_url ? (
          <Space direction="vertical" className={styles.fullWidth}>
            <a
              href={expense.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.receiptLink}
            >
              <LinkOutlined />
              {expense.receipt_url}
            </a>
          </Space>
        ) : (
          <Empty
            image={<FileImageOutlined className={styles.emptyIcon} />}
            description={t("expenseDetails.noReceipts")}
          />
        )}

        <Divider>{t("expenseDetails.activity")}</Divider>

        <Timeline
          items={[
            {
              color: "green",
              content: t("expenseDetails.expenseCreatedOn", { date: formatDate(expense.expense_date) }),
            },
            {
              color: expense.payment_status === PAYMENT_STATUS.PAID.value ? "green" : "gray",
              content:
                expense.payment_status === PAYMENT_STATUS.PAID.value
                  ? t("expenseDetails.paymentCompleted")
                  : t("expenseDetails.awaitingPayment"),
            },
          ]}
        />
      </Flex>
    </Drawer>
  );
}

