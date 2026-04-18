"use client";
import React, { useState } from "react";
import { Tabs, Empty, Space, Typography } from "antd";
import Card from "@/shared/components/Card/Card";
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
import { EventVendors, VendorDetails } from "./components/vendors";
import type { Vendor } from "./models/budget.models";
import { PaymentStatus, PaymentCalendar } from "./components/payments";
import { BudgetCharts, ReportsPage } from "./components/analytics";
import {
  BudgetTemplates,
  BudgetEstimator,
  ActivityLog,
  Notifications,
} from "./components/advanced";
import { BulkOperations } from "./components/planner";

import type { Expense } from "./models/budget.models";
import dashboardStyles from "./BudgetDashboard.module.css";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

function DashboardContent() {
  const { t } = useTranslation();
  const { state, deleteExpense } = useBudget();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
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

  const tabs = [
    { key: "dashboard",     icon: <DashboardOutlined />,    label: t("budgetDashboard.tabs.dashboard") },
    { key: "expenses",      icon: <UnorderedListOutlined />, label: t("budgetDashboard.tabs.expenses") },
    { key: "allocation",    icon: <AppstoreOutlined />,      label: t("budgetDashboard.tabs.allocation") },
    { key: "vendors",       icon: <TeamOutlined />,          label: t("budgetDashboard.tabs.vendors") },
    { key: "payments",      icon: <CalendarOutlined />,      label: t("budgetDashboard.tabs.payments") },
    { key: "analytics",     icon: <LineChartOutlined />,     label: t("budgetDashboard.tabs.analytics") },
    { key: "tools",         icon: <SettingOutlined />,       label: t("budgetDashboard.tabs.tools") },
    { key: "notifications", icon: <BellOutlined />,          label: t("budgetDashboard.tabs.alerts") },
    { key: "bulk",          icon: <CloudUploadOutlined />,   label: t("budgetDashboard.tabs.bulkOperations") },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Space orientation="vertical" className={dashboardStyles.tabContent} size="large">
            <BudgetStats />
            <CategoryList />
          </Space>
        );
      case "expenses":
        return <ExpenseList onAddExpense={() => { setEditingExpense(null); setExpenseModalOpen(true); }} onViewExpense={handleViewExpense} />;
      case "allocation":
        return <BudgetAllocation />;
      case "vendors":
        return <EventVendors onViewVendor={handleViewVendor} />;
      case "payments":
        return (
          <Tabs defaultActiveKey="status" items={[
            { key: "status",   label: t("budgetDashboard.subTabs.paymentStatus"), children: <PaymentStatus /> },
            { key: "calendar", label: t("budgetDashboard.subTabs.calendarView"),  children: <PaymentCalendar /> },
          ]} />
        );
      case "analytics":
        return (
          <Tabs defaultActiveKey="charts" items={[
            { key: "charts",  label: t("budgetDashboard.subTabs.charts"),  children: <BudgetCharts /> },
            { key: "reports", label: t("budgetDashboard.subTabs.reports"), children: <ReportsPage /> },
          ]} />
        );
      case "tools":
        return (
          <Tabs defaultActiveKey="templates" items={[
            { key: "templates", label: t("budgetDashboard.subTabs.templates"),   children: <BudgetTemplates /> },
            { key: "estimator", label: t("budgetDashboard.subTabs.estimator"),   children: <BudgetEstimator /> },
            { key: "activity",  label: t("budgetDashboard.subTabs.activityLog"), children: <ActivityLog /> },
          ]} />
        );
      case "notifications":
        return <Notifications />;
      case "bulk":
        return <BulkOperations />;
      default:
        return null;
    }
  };

  return (
    <div className={dashboardStyles.dashboardContainer}>
      <Title level={3} className={dashboardStyles.dashboardTitle}>
        {t("budgetDashboard.title")}
      </Title>

      <nav className={dashboardStyles.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${dashboardStyles.tabBtn} ${activeTab === tab.key ? dashboardStyles.tabBtnActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className={dashboardStyles.tabBtnIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={dashboardStyles.tabContent}>{renderContent()}</div>

      {/* Modals and Drawers */}
      <ExpenseModal
        visible={expenseModalOpen}
        onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
        editingExpense={editingExpense}
      />

      <ExpenseDetails
        expense={selectedExpense}
        open={expenseDrawerOpen}
        onClose={() => setExpenseDrawerOpen(false)}
        onEdit={() => {
          setEditingExpense(selectedExpense);
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
