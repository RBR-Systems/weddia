"use client";
import React, { useState } from "react";
import { Tabs, Empty, Button, Space, Typography, Alert } from "antd";
import Card from "@/app/common/Card/card";
import {
  DashboardOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  TeamOutlined,
  CalendarOutlined,
  LineChartOutlined,
  SettingOutlined,
  BellOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import { BudgetProvider, useBudget } from "./contexts/BudgetContext";

// Dashboard components
import BudgetStats from "./components/BudgetStats";
import ExpenseModal from "./components/ExpenseModal";

// Feature components
import { CategoryList } from "./components/categories";
import { ExpenseList, ExpenseDetails } from "./components/expenses";
import { BudgetAllocation } from "./components/allocation";
import { VendorList, VendorDetails } from "./components/vendors";
import type { Vendor } from "./components/vendors";
import { PaymentStatus, PaymentCalendar } from "./components/payments";
import { BudgetCharts, ReportsPage } from "./components/analytics";
import {
  BudgetTemplates,
  BudgetEstimator,
  ActivityLog,
  Notifications,
} from "./components/advanced";
import { BulkOperations } from "./components/planner";

import type { Expense } from "./types/budget.types";
import dashboardStyles from "./BudgetDashboard.module.css";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

function DashboardContent() {
  const { t } = useTranslation();
  const { state, deleteExpense } = useBudget();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);

  if (state.isLoading) {
    return <Card loading className={dashboardStyles.loadingCard}>{null}</Card>;
  }

  if (state.error) {
    return (
      <Card>
        <Empty description={state.error} />
      </Card>
    );
  }

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseDrawerOpen(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    deleteExpense(expenseId);
    setExpenseDrawerOpen(false);
  };

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorDrawerOpen(true);
  };

  const tabItems = [
    {
      key: "dashboard",
      label: (
        <span>
          <DashboardOutlined /> {t("budgetDashboard.tabs.dashboard")}
        </span>
      ),
      children: (
        <Space
          orientation="vertical"
          className={dashboardStyles.tabContent}
          size="large"
        >
          <BudgetStats />
          <CategoryList />
        </Space>
      ),
    },
    {
      key: "expenses",
      label: (
        <span>
          <UnorderedListOutlined /> {t("budgetDashboard.tabs.expenses")}
        </span>
      ),
      children: (
        <ExpenseList
          onAddExpense={() => setExpenseModalOpen(true)}
          onViewExpense={handleViewExpense}
        />
      ),
    },
    {
      key: "allocation",
      label: (
        <span>
          <AppstoreOutlined /> {t("budgetDashboard.tabs.allocation")}
        </span>
      ),
      children: <BudgetAllocation />,
    },
    {
      key: "vendors",
      label: (
        <span>
          <TeamOutlined /> {t("budgetDashboard.tabs.vendors")}
        </span>
      ),
      children: <VendorList onViewVendor={handleViewVendor} />,
    },
    {
      key: "payments",
      label: (
        <span>
          <CalendarOutlined /> {t("budgetDashboard.tabs.payments")}
        </span>
      ),
      children: (
        <Tabs
          defaultActiveKey="status"
          items={[
            {
              key: "status",
              label: t("budgetDashboard.subTabs.paymentStatus"),
              children: <PaymentStatus />,
            },
            {
              key: "calendar",
              label: t("budgetDashboard.subTabs.calendarView"),
              children: <PaymentCalendar />,
            },
          ]}
        />
      ),
    },
    {
      key: "analytics",
      label: (
        <span>
          <LineChartOutlined /> {t("budgetDashboard.tabs.analytics")}
        </span>
      ),
      children: (
        <Tabs
          defaultActiveKey="charts"
          items={[
            {
              key: "charts",
              label: t("budgetDashboard.subTabs.charts"),
              children: <BudgetCharts />,
            },
            {
              key: "reports",
              label: t("budgetDashboard.subTabs.reports"),
              children: <ReportsPage />,
            },
          ]}
        />
      ),
    },
    {
      key: "tools",
      label: (
        <span>
          <SettingOutlined /> {t("budgetDashboard.tabs.tools")}
        </span>
      ),
      children: (
        <Tabs
          defaultActiveKey="templates"
          items={[
            {
              key: "templates",
              label: t("budgetDashboard.subTabs.templates"),
              children: <BudgetTemplates />,
            },
            {
              key: "estimator",
              label: t("budgetDashboard.subTabs.estimator"),
              children: <BudgetEstimator />,
            },
            {
              key: "activity",
              label: t("budgetDashboard.subTabs.activityLog"),
              children: <ActivityLog />,
            },
          ]}
        />
      ),
    },
    {
      key: "notifications",
      label: (
        <span>
          <BellOutlined /> {t("budgetDashboard.tabs.alerts")}
        </span>
      ),
      children: <Notifications />,
    },
    {
      key: "bulk",
      label: (
        <span>
          <CloudUploadOutlined /> {t("budgetDashboard.tabs.bulkOperations")}
        </span>
      ),
      children: <BulkOperations />,
    },
  ];

  return (
    <div className={dashboardStyles.dashboardContainer}>
      <Title level={3} className={dashboardStyles.dashboardTitle}>
        {t("budgetDashboard.title")}
      </Title>

      <Tabs defaultActiveKey="dashboard" items={tabItems} size="large" />

      {/* Modals and Drawers */}
      <ExpenseModal
        visible={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />

      <ExpenseDetails
        expense={selectedExpense}
        open={expenseDrawerOpen}
        onClose={() => setExpenseDrawerOpen(false)}
        onEdit={() => {
          setExpenseDrawerOpen(false);
          setExpenseModalOpen(true);
        }}
        onDelete={handleDeleteExpense}
      />

      <VendorDetails
        vendor={selectedVendor}
        open={vendorDrawerOpen}
        onClose={() => setVendorDrawerOpen(false)}
      />
    </div>
  );
}

export default function BudgetDashboardPageWrapper() {
  return (
    <BudgetProvider>
      <DashboardContent />
    </BudgetProvider>
  );
}
