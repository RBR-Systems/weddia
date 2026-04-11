import { EventActions } from "@/app/contexts/EventActions";
import { useEvent } from "@/app/contexts/EventContext";
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  InputNumberProps,
  Modal,
  Select,
} from "antd";
import { useState } from "react";
import TextArea from "antd/es/input/TextArea";
import { getWeddingThemes } from "@/app/constants/wedding-themes";
import { useLocale } from "@/app/hooks/useLocale";
import FormSection from "./FormSection";
import ClientInfoForm from "./ClientInfoForm";
import {
  DollarOutlined,
  EditOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import styles from "./create-event-modal.module.css";
import { useTranslation } from "react-i18next";

type RequiredMark = boolean | "optional";

const CreateEventModal = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [requiredMark, setRequiredMarkType] =
    useState<RequiredMark>("optional");
  const userLocale = useLocale();

  const formatter: InputNumberProps<number>["formatter"] = (value) => {
    if (!value) return "";
    const [start, end] = `${value}`.split(".") || [];
    const v = `${start}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `$ ${end ? `${v}.${end}` : `${v}`}`;
  };

  const onRequiredTypeChange = (_: unknown, values: { requiredMarkValue?: RequiredMark }) => {
    if (values?.requiredMarkValue !== undefined) {
      setRequiredMarkType(values.requiredMarkValue);
    }
  };

  const {
    state: {
      events: { openCreateOpenModal },
    },
    dispatch,
  } = useEvent();

  const closeModal = () => {
    dispatch({
      type: EventActions.SET_OPEN_CREATE_EVENT_MODAL,
      payload: false,
    });
  };

  return (
    <>
      <Modal
        width={800}
        title={<span className={styles.modalTitle}>{t("createEvent.title")}</span>}
        closable={{ "aria-label": t("createEvent.closeButton") }}
        cancelText={t("common.cancel")}
        okButtonProps={{
          className: styles.okButton,
        }}
        okText={t("common.save")}
        open={openCreateOpenModal}
        onOk={closeModal}
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
              <Form.Item label={t("createEvent.form.eventName")} name="eventName" required>
                <Input
                  placeholder={t("createEvent.form.eventNamePlaceholder")}
                  prefix={<EditOutlined className={styles.iconSecondary} />}
                />
              </Form.Item>
              <div className={styles.eventInfoContainer}>
                <Form.Item
                  className={styles.eventInfoItem}
                  label={t("createEvent.form.dateTime")}
                  required
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
                  required
                >
                  <Input
                    placeholder={t("createEvent.form.locationPlaceholder")}
                    prefix={<PushpinOutlined className={styles.iconSecondary} />}
                  />
                </Form.Item>
              </div>
            </FormSection>

            <FormSection title={t("createEvent.sections.details")}>
              <Form.Item label={t("createEvent.form.description")} required>
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
                  required
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
                  required
                >
                  <InputNumber
                    formatter={formatter}
                    prefix={<DollarOutlined className={styles.iconSecondary} />}
                    parser={(value) =>
                      value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                    }
                    className={styles.budgetInput}
                  />
                </Form.Item>
              </div>
              <Form.Item label={t("createEvent.form.comments")} required>
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
    </>
  );
};

export default CreateEventModal;
