import { MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Form, Input } from "antd";
import { useState } from "react";
import styles from "../create-event-modal.module.css";
import { useTranslation } from "react-i18next";
import { formatPhoneNumber } from "../utils/createEvent.utils";
import { PHONE_FORMAT_REGEX } from "../constants/createEvent.constants";

interface ClientInfoFormProps {
  readonly title: string;
  readonly emailPlaceholder: string;
  readonly phonePlaceholder: string;
}

const ClientInfoForm = ({
  title,
  emailPlaceholder,
  phonePlaceholder,
}: ClientInfoFormProps) => {
  const { t } = useTranslation();
  const [phoneValue, setPhoneValue] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneValue(formatPhoneNumber(e.target.value));
  };

  return (
    <>
      <h4 className={styles.clientInfoTitle}>{title}</h4>
      <div className={styles.clientInfoContainer}>
        <Form.Item
          className={styles.clientInfoItem}
          label={t("createEvent.clients.email")}
          required
          rules={[
            { required: true, message: t("createEvent.clients.emailRequired") },
            { type: "email", message: t("createEvent.clients.emailInvalid") },
          ]}
        >
          <Input
            prefix={<MailOutlined className={styles.iconSecondary} />}
            placeholder={emailPlaceholder}
          />
        </Form.Item>
        <Form.Item
          className={styles.clientInfoItem}
          label={t("createEvent.clients.phoneNumber")}
          required
          rules={[
            { required: true, message: t("createEvent.clients.phoneRequired") },
            {
              pattern: PHONE_FORMAT_REGEX,
              message: t("createEvent.clients.phoneInvalid"),
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined className={styles.iconSecondary} />}
            placeholder={phonePlaceholder}
            value={phoneValue}
            onChange={handlePhoneChange}
            maxLength={14}
          />
        </Form.Item>
      </div>
    </>
  );
};

export default ClientInfoForm;
