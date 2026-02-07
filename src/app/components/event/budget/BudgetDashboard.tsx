"use client";
import React, { useState } from "react";
import { Card, Tabs, Empty, Button, Space, Typography } from "antd";
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

const { Title } = Typography;

function DashboardContent() {
  const { state, deleteExpense } = useBudget();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);

  if (state.isLoading) {
    return <Card loading style={{ minHeight: 400 }} />;
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
          <DashboardOutlined /> Dashboard
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <BudgetStats />
          <CategoryList />
        </Space>
      ),
    },
    {
      key: "expenses",
      label: (
        <span>
          <UnorderedListOutlined /> Expenses
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
          <AppstoreOutlined /> Allocation
        </span>
      ),
      children: <BudgetAllocation />,
    },
    {
      key: "vendors",
      label: (
        <span>
          <TeamOutlined /> Vendors
        </span>
      ),
      children: <VendorList onViewVendor={handleViewVendor} />,
    },
    {
      key: "payments",
      label: (
        <span>
          <CalendarOutlined /> Payments
        </span>
      ),
      children: (
        <Tabs
          defaultActiveKey="status"
          items={[
            {
              key: "status",
              label: "Payment Status",
              children: <PaymentStatus />,
            },
            {
              key: "calendar",
              label: "Calendar View",
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
          <LineChartOutlined /> Analytics
        </span>
      ),
      children: (
        <Tabs
          defaultActiveKey="charts"
          items={[
            { key: "charts", label: "Charts", children: <BudgetCharts /> },
            { key: "reports", label: "Reports", children: <ReportsPage /> },
          ]}
        />
      ),
    },
    {
      key: "tools",
      label: (
        <span>
          <SettingOutlined /> Tools
        </span>
      ),
      children: (
        <Tabs
          defaultActiveKey="templates"
          items={[
            {
              key: "templates",
              label: "Templates",
              children: <BudgetTemplates />,
            },
            {
              key: "estimator",
              label: "Estimator",
              children: <BudgetEstimator />,
            },
            {
              key: "activity",
              label: "Activity Log",
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
          <BellOutlined /> Alerts
        </span>
      ),
      children: <Notifications />,
    },
    {
      key: "bulk",
      label: (
        <span>
          <CloudUploadOutlined /> Bulk Operations
        </span>
      ),
      children: <BulkOperations />,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        Wedding Budget Manager
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
