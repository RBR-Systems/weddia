import { useEffect, useState } from "react";
import { App, Form } from "antd";
import { useTranslation } from "react-i18next";
import { useEvent } from "@/shared/contexts/EventContext";
import { EventActions } from "@/shared/contexts/eventActions";
import { EventStatus } from "@/features/events-list/models/enums/eventList.models";
import { createEvent } from "../api/createEventApi";
import {
  buildCreateEventPayload,
  formatEventDate,
} from "../utils/createEvent.utils";
import type { CreateEventFormValues, RequiredMark } from "../models/createEvent.models";
import { DEFAULT_REQUIRED_MARK } from "../constants/createEvent.constants";
import { fetchOrganizations } from "@/features/organizations/api/organizationsApi";
import type { Organization } from "@/features/organizations/models/organizations.models";
import { useAuth } from "@/shared/contexts/AuthContext";

interface UseCreateEventResult {
  form: ReturnType<typeof Form.useForm<CreateEventFormValues>>[0];
  saving: boolean;
  requiredMark: RequiredMark;
  isOpen: boolean;
  orgOptions: { value: number; label: string }[];
  handleOk: () => Promise<void>;
  handleCancel: () => void;
  onValuesChange: (
    _: unknown,
    values: { requiredMarkValue?: RequiredMark },
  ) => void;
}

export const useCreateEvent = (): UseCreateEventResult => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [form] = Form.useForm<CreateEventFormValues>();
  const [saving, setSaving] = useState(false);
  const [requiredMark, setRequiredMark] = useState<RequiredMark>(DEFAULT_REQUIRED_MARK);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  const { isPlatformAdmin } = useAuth();
  const {
    state: { events: { openCreateOpenModal } },
    dispatch,
    userOrgIds,
  } = useEvent();

  useEffect(() => {
    fetchOrganizations()
      .then((all) => {
        const filtered = isPlatformAdmin ? all : all.filter((o) => userOrgIds.includes(o.organization_id));
        setOrgs(filtered);
      })
      .catch(() => {});
  }, [isPlatformAdmin, userOrgIds]);

  useEffect(() => {
    if (openCreateOpenModal && userOrgIds.length > 0) {
      form.setFieldValue("organizationId", userOrgIds[0]);
    }
  }, [openCreateOpenModal, userOrgIds, form]);

  const handleCancel = () => {
    dispatch({ type: EventActions.SET_OPEN_CREATE_EVENT_MODAL, payload: false });
  };

  const onValuesChange = (
    _: unknown,
    values: { requiredMarkValue?: RequiredMark },
  ) => {
    if (values?.requiredMarkValue !== undefined) {
      setRequiredMark(values.requiredMarkValue);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = buildCreateEventPayload(values);
      const created = await createEvent(payload);

      dispatch({
        type: EventActions.ADD_EVENT,
        payload: {
          id: created?.eventId,
          eventName: values.eventName,
          status: EventStatus.NOT_STARTED,
          date: formatEventDate(payload.eventDate),
          rawDate: payload.eventDate,
          description: values.description ?? "",
          clients: "",
          location: values.eventAddress ?? "",
          invites: 0,
          rsvp: 0,
          tasks: 0,
          sits: 0,
          budget: values.budget ?? 0,
          spent: 0,
        },
      });

      message.success(t("createEvent.title") + " ✓");
      form.resetFields();
      handleCancel();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  const orgOptions = orgs.map((o) => ({ value: o.organization_id, label: o.name }));

  return {
    form,
    saving,
    requiredMark,
    isOpen: openCreateOpenModal,
    orgOptions,
    handleOk,
    handleCancel,
    onValuesChange,
  };
};
