"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { App, Table, Button, Input, Tag, Avatar, Space, Typography, Row, Col, Modal, Form, Select, Popconfirm, Switch } from "antd";
import { PlusOutlined, ShopOutlined, PhoneOutlined, MailOutlined, EditOutlined, DeleteOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { getVendors, updateVendor, createVendor, deleteVendor } from "@/features/budget/api/vendorsApi";
import type { Vendor } from "@/features/budget/models/budget.models";
import type { ColumnsType } from "antd/es/table";
import Card from "@/shared/components/Card/Card";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import expenseStyles from "@/features/budget/components/expenses/ExpenseModal/ExpenseModal.module.css";
import styles from "@/features/budget/components/vendors/vendor-list.module.css";

const { Search } = Input;
const { Text, Title } = Typography;

const VENDOR_CATEGORIES = [
  "Catering", "Florals", "Photography", "Videography",
  "Music / DJ", "Venue", "Decoration", "Transportation",
  "Hair & Makeup", "Cake", "Other",
];

export default function VendorCatalog() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form] = Form.useForm();

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendors();
      setVendors(data);
    } catch {
      message.error(t("vendorCatalog.loadFailed", "Failed to load vendors"));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openAdd = () => {
    setEditingVendor(null);
    form.resetFields();
    form.setFieldValue("is_active", true);
    setModalOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.setFieldsValue({
      name:         vendor.name,
      category:     vendor.category,
      contact_name: vendor.contact_name,
      phone:        vendor.phone,
      email:        vendor.email,
      address:      vendor.address,
      notes:        vendor.notes,
      is_active:    vendor.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingVendor) {
        await updateVendor(editingVendor.vendor_id, {
          vendorName:    values.name,
          category:      values.category ?? "",
          contactPerson: values.contact_name,
          email:         values.email,
          mobilePhone:   values.phone,
          address:       values.address,
          notes:         values.notes,
          isActive:      values.is_active !== false,
        });
        message.success(t("vendorCatalog.updateSuccess"));
      } else {
        await createVendor({
          vendorName:    values.name,
          category:      values.category ?? "",
          contactPerson: values.contact_name,
          email:         values.email,
          mobilePhone:   values.phone,
          address:       values.address,
          notes:         values.notes,
        });
        message.success(t("vendorList.form.vendorCreated"));
      }
      setModalOpen(false);
      form.resetFields();
      loadVendors();
    } catch (err) {
      const validationErr = err as { errorFields?: unknown };
      if (validationErr?.errorFields) return;
      message.error(editingVendor ? t("vendorCatalog.updateFailed") : t("vendorList.form.vendorCreateFailed"));
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    try {
      await deleteVendor(vendor.vendor_id);
      message.success(t("vendorCatalog.deleteSuccess"));
      loadVendors();
    } catch {
      message.error(t("vendorCatalog.deleteFailed"));
    }
  };

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
        <Space direction="vertical" size={0}>
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
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title={t("vendorCatalog.deleteConfirm")}
            onConfirm={() => handleDelete(record)}
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
    <>
      <Title level={3}>{t("vendorCatalog.title")}</Title>

      <Row gutter={16} className={styles.rowSpacing}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title={t("vendorList.totalVendors")} value={vendors.length} />
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
        title={t("vendorCatalog.directory")}
        extra={
          <Space>
            <Search
              placeholder={t("vendorList.searchPlaceholder")}
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchWidth}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              {t("vendorList.addVendor")}
            </Button>
          </Space>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={filtered}
          rowKey="vendor_id"
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: t("vendorCatalog.emptyText") }}
        />
      </Card>

      <Modal
        title={editingVendor ? t("vendorCatalog.edit") : t("vendorList.addVendor")}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText={editingVendor ? t("common.save") : t("common.create")}
        cancelText={t("common.cancel")}
        width={520}
        forceRender
        destroyOnHidden={false}
      >
        <Form form={form} layout="vertical" className="mt-4">
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

          <div className={`${expenseStyles.paymentSection} mb-12`}>
            <p className={expenseStyles.sectionLabel}>{t("vendorList.form.category")}</p>
            <Form.Item name="category" noStyle>
              <Select
                placeholder={t("vendorList.form.categoryPlaceholder")}
                className="w-full"
                options={VENDOR_CATEGORIES.map((c) => ({ label: c, value: c }))}
              />
            </Form.Item>
          </div>

          <div className={expenseStyles.paymentSection} style={{ marginBottom: 12 }}>
            <p className={expenseStyles.sectionLabel}>
              <UserOutlined className="mr-6" />
              {t("vendorList.form.contactPerson")}
            </p>
            <div className={expenseStyles.twoCol}>
              <Form.Item name="contact_name" label={t("vendorList.form.contactPerson")} className="mb-0">
                <Input placeholder={t("vendorList.form.contactPlaceholder")} />
              </Form.Item>
              <Form.Item name="phone" label={t("vendorList.form.phone")} className="mb-0">
                <Input placeholder={t("vendorList.form.phonePlaceholder")} prefix={<PhoneOutlined />} />
              </Form.Item>
            </div>
            <Form.Item name="email" label={t("vendorList.form.email")} className="mb-0 mt-10">
              <Input type="email" placeholder={t("vendorList.form.emailPlaceholder")} prefix={<MailOutlined />} />
            </Form.Item>
          </div>

          <div className={expenseStyles.paymentSection}>
            <p className={expenseStyles.sectionLabel}>
              <EnvironmentOutlined className="mr-6" />
              {t("vendorList.form.address")}
            </p>
            <Form.Item name="address" className="mb-10">
              <Input placeholder={t("vendorList.form.addressPlaceholder")} />
            </Form.Item>
            <Form.Item name="notes" className="mb-0">
              <Input.TextArea rows={2} placeholder={t("vendorList.form.notesPlaceholder")} />
            </Form.Item>
          </div>

          {editingVendor && (
            <div className={expenseStyles.paymentSection} style={{ marginTop: 12 }}>
              <Form.Item
                name="is_active"
                label={t("vendorList.columns.status")}
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch
                  checkedChildren={t("vendorList.active")}
                  unCheckedChildren={t("vendorList.inactive")}
                />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
}

