"use client";

import { EventActions } from "@/shared/contexts/eventActions";
import { useEvent } from "@/shared/contexts/EventContext";
import { apiPost } from "@/shared/api/apiClient";
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  InputNumberProps,
  Modal,
  Select,
  message,
} from "antd";
import { formatInputNumber, parseInputNumber } from "@/utils/formatters.utils";
import { useState } from "react";
import dayjs from "dayjs";
import TextArea from "antd/es/input/TextArea";
import { getWeddingThemes } from "@/shared/constants/weddingThemes.constants";
import { useLocale } from "@/shared/hooks/useLocale";
import FormSection from "./FormSection";
import ClientInfoForm from "./ClientInfoForm";
import {
  DollarOutlined,
  EditOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import styles from "./create-event-modal.module.css";
import { useTranslation } from "react-i18next";
import { EventStatus } from "@/features/events-list/models/enums/eventList.models";

type RequiredMark = boolean | "optional";

const CreateEventModal = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [requiredMark, setRequiredMarkType] = useState<RequiredMark>("optional");
  const [saving, setSaving] = useState(false);
  const userLocale = useLocale();

  const formatter: InputNumberProps<number>["formatter"] = (value) => {
    if (!value) return "";
    return `$ ${formatInputNumber(value)}`;
  };

  const onRequiredTypeChange = (_: unknown, values: { requiredMarkValue?: RequiredMark }) => {
    if (values?.requiredMarkValue !== undefined) {
      setRequiredMarkType(values.requiredMarkValue);
    }
  };

  const {
    state: { events: { openCreateOpenModal } },
    dispatch,
  } = useEvent();

  const closeModal = () => {
    dispatch({ type: EventActions.SET_OPEN_CREATE_EVENT_MODAL, payload: false });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const isoDate: string = values.eventDate
        ? (values.eventDate as dayjs.Dayjs).toISOString()
        : new Date().toISOString();

      const body = {
        eventName: values.eventName,
        title: values.eventName,
        description: values.description ?? "",
        eventDate: isoDate,
        eventAddress: values.eventAddress ?? "",
        budget: values.budget ?? 0,
        status: "not_started",
      };

      const created = await apiPost<{ eventId: number }>("/api/events?adminId=1", body);

      const d = new Date(isoDate);
      const formattedDate = d.toLocaleDateString("en-US", {
        day: "numeric", month: "long", year: "numeric",
      });
      dispatch({
        type: EventActions.ADD_EVENT,
        payload: {
          id: created?.eventId,
          eventName: values.eventName,
          status: EventStatus.NOT_STARTED,
          date: formattedDate,
          rawDate: isoDate,
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
      closeModal();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return; // validation error
      message.error("Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      style={{ width: 800 }}
      title={<span className={styles.modalTitle}>{t("createEvent.title")}</span>}
      closable={{ "aria-label": t("createEvent.closeButton") }}
      cancelText={t("common.cancel")}
      okButtonProps={{ className: styles.okButton, loading: saving }}
      okText={t("common.save")}
      open={openCreateOpenModal}
      onOk={handleOk}
      onCancel={closeModal}
    >
      <div className={styles.createEventModal}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ requiredMarkValue: requiredMark }}
          onValuesChange={onRequiredTypeChange}
          requiredMark={requiredMark}
        >
          <FormSection title={t("createEvent.sections.eventInfo")}>
            <Form.Item
              label={t("createEvent.form.eventName")}
              name="eventName"
              rules={[{ required: true, message: "Event name is required" }]}
            >
              <Input
                placeholder={t("createEvent.form.eventNamePlaceholder")}
                prefix={<EditOutlined className={styles.iconSecondary} />}
              />
            </Form.Item>
            <div className={styles.eventInfoContainer}>
              <Form.Item
                className={styles.eventInfoItem}
                label={t("createEvent.form.dateTime")}
                name="eventDate"
                rules={[{ required: true, message: "Date is required" }]}
              >
                <DatePicker
                  showTime
                  className={styles.datePicker}
                  showHour
                  showMinute
                  placeholder={t("createEvent.form.dateTimePlaceholder")}
                  locale={userLocale.DatePicker}
                />
              </Form.Item>
              <Form.Item
                className={styles.eventInfoItem}
                label={t("createEvent.form.location")}
                name="eventAddress"
                rules={[{ required: true, message: "Location is required" }]}
              >
                <Input
                  placeholder={t("createEvent.form.locationPlaceholder")}
                  prefix={<PushpinOutlined className={styles.iconSecondary} />}
                />
              </Form.Item>
            </div>
          </FormSection>

          <FormSection title={t("createEvent.sections.details")}>
            <Form.Item
              label={t("createEvent.form.description")}
              name="description"
            >
              <TextArea
                placeholder={t("createEvent.form.descriptionPlaceholder")}
                maxLength={250}
                showCount
                className={styles.descriptionTextarea}
              />
            </Form.Item>
            <div className={styles.detailsContainer}>
              <Form.Item
                className={styles.detailsItem}
                label={t("createEvent.form.theme")}
                name="theme"
              >
                <Select
                  placeholder={t("createEvent.form.themePlaceholder")}
                  options={getWeddingThemes()}
                  className={styles.themeSelect}
                />
              </Form.Item>
              <Form.Item
                className={styles.detailsItem}
                label={t("createEvent.form.budget")}
                name="budget"
                rules={[{ required: true, message: "Budget is required" }]}
              >
                <InputNumber
                  formatter={formatter}
                  prefix={<DollarOutlined className={styles.iconSecondary} />}
                  parser={(value) =>
                    parseInputNumber(value) as unknown as number
                  }
                  className={styles.budgetInput}
                />
              </Form.Item>
            </div>
            <Form.Item
              label={t("createEvent.form.comments")}
              name="comments"
            >
              <TextArea
                placeholder={t("createEvent.form.commentsPlaceholder")}
                maxLength={250}
                showCount
                className={styles.commentsTextarea}
              />
            </Form.Item>
          </FormSection>

          <FormSection title={t("createEvent.sections.clients")}>
            <ClientInfoForm
              title={t("createEvent.clients.bride")}
              emailPlaceholder={t("createEvent.clients.brideEmail")}
              phonePlaceholder={t("createEvent.clients.bridePhone")}
            />
            <ClientInfoForm
              title={t("createEvent.clients.groom")}
              emailPlaceholder={t("createEvent.clients.groomEmail")}
              phonePlaceholder={t("createEvent.clients.groomPhone")}
            />
          </FormSection>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateEventModal;
