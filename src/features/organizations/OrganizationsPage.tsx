"use client";
import { useState } from "react";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Table, Tabs, Tag } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { useOrganizations } from "./hooks/useOrganizations";
import type { Organization, OrgUser, OrgFormValues, UserFormValues } from "./models/organizations.models";

export default function OrganizationsPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { orgs, users, loading, addOrg, editOrg, removeOrg, addUser } = useOrganizations();

  const [orgModal, setOrgModal] = useState<{ open: boolean; editing?: Organization }>({ open: false });
  const [userModal, setUserModal] = useState(false);
  const [orgForm] = Form.useForm<OrgFormValues>();
  const [userForm] = Form.useForm<UserFormValues>();
  const [saving, setSaving] = useState(false);

  const openNewOrg = () => {
    orgForm.resetFields();
    setOrgModal({ open: true });
  };

  const openEditOrg = (org: Organization) => {
    orgForm.setFieldsValue({ name: org.name, description: org.description ?? "", owner_id: org.owner_id, status: org.status });
    setOrgModal({ open: true, editing: org });
  };

  const handleOrgSave = async () => {
    const values = await orgForm.validateFields();
    setSaving(true);
    try {
      if (orgModal.editing) {
        await editOrg(orgModal.editing.organization_id, values);
        message.success(t("common.saved"));
      } else {
        await addOrg(values);
        message.success(t("common.created"));
      }
      setOrgModal({ open: false });
    } catch {
      message.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async (id: number) => {
    try {
      await removeOrg(id);
      message.success(t("common.deleted"));
    } catch {
      message.error(t("common.error"));
    }
  };

  const handleUserSave = async () => {
    const values = await userForm.validateFields();
    setSaving(true);
    try {
      await addUser(values);
      message.success(t("common.created"));
      setUserModal(false);
      userForm.resetFields();
    } catch {
      message.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const orgColumns: ColumnsType<Organization> = [
    { title: t("organizations.nameLabel"), dataIndex: "name", key: "name" },
    { title: t("organizations.descriptionLabel"), dataIndex: "description", key: "description", render: (v) => v || "—" },
    {
      title: t("organizations.ownerLabel"),
      dataIndex: "owner_id",
      key: "owner_id",
      render: (id: number) => {
        const u = users.find((x) => x.user_id === id);
        return u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email : id;
      },
    },
    {
      title: t("organizations.statusLabel"),
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={v === "active" ? "green" : "default"}>{v}</Tag>,
    },
    {
      key: "actions",
      width: 80,
      render: (_: unknown, record: Organization) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditOrg(record)} />
          <Popconfirm title={t("organizations.deleteOrgConfirm")} onConfirm={() => handleDeleteOrg(record.organization_id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const userColumns: ColumnsType<OrgUser> = [
    { title: t("organizations.emailLabel"), dataIndex: "email", key: "email" },
    {
      title: t("organizations.firstNameLabel"),
      key: "name",
      render: (_: unknown, r: OrgUser) => `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "—",
    },
    { title: t("organizations.phoneLabel"), dataIndex: "mobile_phone", key: "mobile_phone", render: (v) => v || "—" },
    {
      title: t("organizations.isActiveLabel"),
      dataIndex: "is_active",
      key: "is_active",
      render: (v: boolean) => <Tag color={v ? "green" : "red"}>{v ? t("common.yes") : t("common.no")}</Tag>,
    },
  ];

  const statusOptions = [
    { value: "active", label: t("organizations.statusActive") },
    { value: "inactive", label: t("organizations.statusInactive") },
  ];

  const ownerOptions = users.map((u) => ({
    value: u.user_id,
    label: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
  }));

  return (
    <>
      <Tabs
        items={[
          {
            key: "orgs",
            label: t("organizations.tabOrgs"),
            children: (
              <Table
                columns={orgColumns}
                dataSource={orgs}
                rowKey="organization_id"
                loading={loading}
                size="small"
                title={() => (
                  <Button type="primary" icon={<PlusOutlined />} onClick={openNewOrg}>
                    {t("organizations.newOrg")}
                  </Button>
                )}
              />
            ),
          },
          {
            key: "users",
            label: t("organizations.tabUsers"),
            children: (
              <Table
                columns={userColumns}
                dataSource={users}
                rowKey="user_id"
                loading={loading}
                size="small"
                title={() => (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { userForm.resetFields(); setUserModal(true); }}>
                    {t("organizations.newUser")}
                  </Button>
                )}
              />
            ),
          },
        ]}
      />

      <Modal
        open={orgModal.open}
        title={orgModal.editing ? t("organizations.editOrg") : t("organizations.newOrg")}
        onOk={handleOrgSave}
        onCancel={() => setOrgModal({ open: false })}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={orgForm} layout="vertical">
          <Form.Item name="name" label={t("organizations.nameLabel")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t("organizations.descriptionLabel")}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="owner_id" label={t("organizations.ownerLabel")} rules={[{ required: true }]}>
            <Select options={ownerOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="status" label={t("organizations.statusLabel")} rules={[{ required: true }]} initialValue="active">
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={userModal}
        title={t("organizations.newUser")}
        onOk={handleUserSave}
        onCancel={() => setUserModal(false)}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={userForm} layout="vertical">
          <Form.Item name="email" label={t("organizations.emailLabel")} rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="first_name" label={t("organizations.firstNameLabel")}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label={t("organizations.lastNameLabel")}>
            <Input />
          </Form.Item>
          <Form.Item name="mobile_phone" label={t("organizations.phoneLabel")}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={t("organizations.passwordLabel")} rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
