import { MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Form, Input } from "antd";
import { useState } from "react";
import styles from "./create-event-modal.module.css";
import { useTranslation } from "react-i18next";

interface ClientInfoFormProps {
  title: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
}

const ClientInfoForm = ({
  title,
  emailPlaceholder,
  phonePlaceholder,
}: ClientInfoFormProps) => {
  const { t } = useTranslation();
  const [phoneValue, setPhoneValue] = useState("");

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replaceAll(/\D/g, "");

    if (phoneNumber.length === 0) return "";
    if (phoneNumber.length <= 2) {
      return `(${phoneNumber}`;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    } else {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(
        2,
        6
      )}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneValue(formatted);
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
              pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
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
