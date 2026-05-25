"use client";
import { useMemo, useState } from "react";
import { App, Button, Form, Modal, Popconfirm, Select, Table, Tabs, Tag } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { useTeam } from "./hooks/useTeam";
import { useOrganizations } from "@/features/organizations/hooks/useOrganizations";
import { useEvent } from "@/shared/contexts/EventContext";
import type { TeamMember, MemberEvent, TeamMemberFormValues, MemberEventFormValues } from "./models/team.models";

export default function TeamPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { members, memberEvents, loading, addMember, removeMember, assignToEvent, removeFromEvent } = useTeam();
  const { orgs, users, roles } = useOrganizations();
  const { state: { events: { allEvents } } } = useEvent();

  const [memberModal, setMemberModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [memberForm] = Form.useForm<TeamMemberFormValues>();
  const [eventForm] = Form.useForm<MemberEventFormValues>();
  const [saving, setSaving] = useState(false);

  const usersById = useMemo(() => new Map(users.map((u) => [u.user_id, u])), [users]);
  const orgsById = useMemo(() => new Map(orgs.map((o) => [o.organization_id, o])), [orgs]);
  const rolesById = useMemo(() => new Map(roles.map((r) => [r.role_id, r])), [roles]);
  const eventsById = useMemo(() => new Map(allEvents.map((e) => [Number(e.id), e])), [allEvents]);

  const handleAddMember = async () => {
    const values = await memberForm.validateFields();
    setSaving(true);
    try {
      await addMember(values);
      message.success(t("common.created"));
      setMemberModal(false);
      memberForm.resetFields();
    } catch {
      message.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (id: number) => {
    try {
      await removeMember(id);
      message.success(t("common.deleted"));
    } catch {
      message.error(t("common.error"));
    }
  };

  const handleAssignEvent = async () => {
    const values = await eventForm.validateFields();
    setSaving(true);
    try {
      await assignToEvent(values);
      message.success(t("common.created"));
      setEventModal(false);
      eventForm.resetFields();
    } catch {
      message.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromEvent = async (memberId: number, eventId: number) => {
    try {
      await removeFromEvent(memberId, eventId);
      message.success(t("common.deleted"));
    } catch {
      message.error(t("common.error"));
    }
  };

  const memberColumns: ColumnsType<TeamMember> = [
    {
      title: t("team.organizationLabel"),
      dataIndex: "organization_id",
      key: "org",
      render: (id: number) => orgsById.get(id)?.name ?? "—",
    },
    {
      title: t("team.userLabel"),
      dataIndex: "user_id",
      key: "user",
      render: (id: number) => {
        const u = usersById.get(id);
        return u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email : "—";
      },
    },
    {
      title: t("team.roleLabel"),
      dataIndex: "role_id",
      key: "role",
      render: (id: number) => rolesById.get(id)?.role_name ?? "—",
    },
    {
      title: t("team.statusLabel"),
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={v === "active" ? "green" : "default"}>{v ?? "—"}</Tag>,
    },
    {
      key: "actions",
      width: 60,
      render: (_: unknown, record: TeamMember) => (
        <Popconfirm title={t("team.removeMemberConfirm")} onConfirm={() => handleRemoveMember(record.member_id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const memberEventColumns: ColumnsType<MemberEvent> = [
    {
      title: t("team.memberLabel"),
      dataIndex: "member_id",
      key: "member",
      render: (id: number) => {
        const m = members.find((x) => x.member_id === id);
        if (!m) return id;
        const u = usersById.get(m.user_id!);
        return u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email : id;
      },
    },
    {
      title: t("team.eventLabel"),
      dataIndex: "event_id",
      key: "event",
      render: (id: number) => eventsById.get(id)?.eventName ?? id,
    },
    {
      title: t("team.statusLabel"),
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={v === "active" ? "green" : "default"}>{v ?? "—"}</Tag>,
    },
    {
      key: "actions",
      width: 60,
      render: (_: unknown, record: MemberEvent) => (
        <Popconfirm title={t("team.removeFromEventConfirm")} onConfirm={() => handleRemoveFromEvent(record.member_id, record.event_id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const orgOptions = orgs.map((o) => ({ value: o.organization_id, label: o.name }));
  const userOptions = users.map((u) => ({
    value: u.user_id,
    label: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
  }));
  const roleOptions = roles.map((r) => ({ value: r.role_id, label: r.role_name }));
  const eventOptions = allEvents.map((e) => ({ value: Number(e.id), label: e.eventName }));
  const memberOptions = members.map((m) => {
    const u = usersById.get(m.user_id!);
    const label = u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email : String(m.member_id);
    return { value: m.member_id, label };
  });

  const statusOptions = [
    { value: "active", label: t("team.statusActive") },
    { value: "inactive", label: t("team.statusInactive") },
  ];

  return (
    <>
      <Tabs
        items={[
          {
            key: "members",
            label: t("team.tabMembers"),
            children: (
              <Table
                columns={memberColumns}
                dataSource={members}
                rowKey="member_id"
                loading={loading}
                size="small"
                title={() => (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { memberForm.resetFields(); setMemberModal(true); }}>
                    {t("team.addMember")}
                  </Button>
                )}
              />
            ),
          },
          {
            key: "events",
            label: t("team.tabEventAccess"),
            children: (
              <Table
                columns={memberEventColumns}
                dataSource={memberEvents}
                rowKey={(r) => `${r.member_id}-${r.event_id}`}
                loading={loading}
                size="small"
                title={() => (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { eventForm.resetFields(); setEventModal(true); }}>
                    {t("team.assignToEvent")}
                  </Button>
                )}
              />
            ),
          },
        ]}
      />

      <Modal
        open={memberModal}
        title={t("team.addMember")}
        onOk={handleAddMember}
        onCancel={() => setMemberModal(false)}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item name="organization_id" label={t("team.organizationLabel")} rules={[{ required: true }]}>
            <Select options={orgOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="user_id" label={t("team.userLabel")} rules={[{ required: true }]}>
            <Select options={userOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="role_id" label={t("team.roleLabel")}>
            <Select options={roleOptions} allowClear />
          </Form.Item>
          <Form.Item name="status" label={t("team.statusLabel")} rules={[{ required: true }]} initialValue="active">
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={eventModal}
        title={t("team.assignToEvent")}
        onOk={handleAssignEvent}
        onCancel={() => setEventModal(false)}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={eventForm} layout="vertical">
          <Form.Item name="member_id" label={t("team.memberLabel")} rules={[{ required: true }]}>
            <Select options={memberOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="event_id" label={t("team.eventLabel")} rules={[{ required: true }]}>
            <Select options={eventOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="status" label={t("team.statusLabel")} rules={[{ required: true }]} initialValue="active">
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
