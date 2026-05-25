"use client";
import { DatePicker, Form, Input, InputNumber, Modal, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import { DollarOutlined, EditOutlined, PushpinOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { getWeddingThemes } from "@/shared/constants/weddingThemes.constants";
import { useLocale } from "@/shared/hooks/useLocale";
import { useCreateEvent } from "./hooks/useCreateEvent";
import { budgetFormatter, budgetParser } from "./utils/createEvent.utils";
import FormSection from "./components/FormSection";
import ClientInfoForm from "./components/ClientInfoForm";
import styles from "./create-event-modal.module.css";

const CreateEventModal = () => {
  const { t } = useTranslation();
  const userLocale = useLocale();
  const {
    form,
    saving,
    requiredMark,
    isOpen,
    handleOk,
    handleCancel,
    onValuesChange,
  } = useCreateEvent();

  return (
    <Modal
      style={{ width: 800 }}
      title={<span className={styles.modalTitle}>{t("createEvent.title")}</span>}
      closable={{ "aria-label": t("createEvent.closeButton") }}
      cancelText={t("common.cancel")}
      okButtonProps={{ className: styles.okButton, loading: saving }}
      okText={t("common.save")}
      open={isOpen}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div className={styles.createEventModal}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ requiredMarkValue: requiredMark }}
          onValuesChange={onValuesChange}
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
                  formatter={budgetFormatter}
                  parser={budgetParser}
                  prefix={<DollarOutlined className={styles.iconSecondary} />}
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

