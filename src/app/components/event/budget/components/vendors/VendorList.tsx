"use client";
import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  message,
} from "antd";
import {
  PlusOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
} from "@ant-design/icons";
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
      title: "Vendor",
      key: "vendor",
      render: (_, record) => (
        <Space>
          <Avatar
            style={{ backgroundColor: "#1890ff" }}
            icon={<ShopOutlined />}
          />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.category}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.email && (
            <Text style={{ fontSize: 12 }}>
              <MailOutlined /> {record.email}
            </Text>
          )}
          {record.phone && (
            <Text style={{ fontSize: 12 }}>
              <PhoneOutlined /> {record.phone}
            </Text>
          )}
          {!record.email && !record.phone && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
    {
      title: "Expenses",
      dataIndex: "expense_count",
      key: "expense_count",
      align: "center",
      sorter: (a, b) => a.expense_count - b.expense_count,
    },
    {
      title: "Total Spent",
      dataIndex: "total_spent",
      key: "total_spent",
      render: (amount: number) => formatCurrency(amount, state.currency),
      sorter: (a, b) => a.total_spent - b.total_spent,
      align: "right",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
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
      message.success("Vendor added (vendors are auto-created from expenses)");
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Total Vendors" value={vendors.length} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Vendor Spending"
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
              title="Active Vendors"
              value={vendors.filter((v) => v.status === "active").length}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Vendor Directory"
        extra={
          <Space>
            <Search
              placeholder="Search vendors..."
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              Add Vendor
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
            emptyText: "No vendors yet. Add expenses with vendor names.",
          }}
        />
      </Card>

      <Modal
        title="Add Vendor"
        open={modalOpen}
        onOk={handleAddVendor}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Vendor Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter vendor name" />
          </Form.Item>
          <Form.Item name="contact_name" label="Contact Person">
            <Input placeholder="Contact name" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="vendor@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+1 (555) 000-0000" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
