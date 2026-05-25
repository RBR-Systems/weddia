import { useState } from "react";
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

interface UseCreateEventResult {
  form: ReturnType<typeof Form.useForm<CreateEventFormValues>>[0];
  saving: boolean;
  requiredMark: RequiredMark;
  isOpen: boolean;
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
  const [requiredMark, setRequiredMark] =
    useState<RequiredMark>(DEFAULT_REQUIRED_MARK);

  const {
    state: {
      events: { openCreateOpenModal },
    },
    dispatch,
    userOrgId,
  } = useEvent();

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
      const payload = buildCreateEventPayload(values, userOrgId);
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

  return {
    form,
    saving,
    requiredMark,
    isOpen: openCreateOpenModal,
    handleOk,
    handleCancel,
    onValuesChange,
  };
};
