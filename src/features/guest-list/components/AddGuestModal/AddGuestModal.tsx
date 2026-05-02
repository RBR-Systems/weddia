"use client";
import { useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Button } from "antd";
import { useTranslation } from "react-i18next";
import { GuestFormValues } from "../../models/guestList.models";
import { formatPhone } from "@/shared/utils/formatters.utils";

interface Relation {
  relation_id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  relations: Relation[];
  countryCodes: Record<string, string>;
  onSubmit: (values: GuestFormValues, onSuccess: () => void, setAdding: (v: boolean) => void) => void;
}

const AddGuestModal: React.FC<Props> = ({ open, onClose, relations, countryCodes, onSubmit }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const country = Form.useWatch?.("country", form);
  const [adding, setAdding] = useState(false);

  function handleClose() {
    form.resetFields();
    onClose();
  }

  return (
    <Modal open={open} title={t("guestList.addGuest", "Add Guest")} onCancel={handleClose} footer={null}>
      <Form layout="vertical" form={form} onFinish={(values) => onSubmit(values, handleClose, setAdding)}>
        <Form.Item name="first_name" label={t("guestList.firstName", "First name")} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="last_name" label={t("guestList.lastName", "Last name")}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t("guestList.email", "Email")}
          rules={[{ type: "email", message: t("guestList.validEmail", "Please enter a valid email address") }]}>
          <Input />
        </Form.Item>
        <Form.Item name="country" label={t("guestList.country", "Country")} initialValue="US">
          <Select showSearch optionFilterProp="children" placeholder="Select country">
            {Object.keys(countryCodes).map((iso) => (
              <Select.Option key={iso} value={iso}>{iso} (+{countryCodes[iso]})</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="phone" label="Phone" rules={[{
          validator: (_rule, value) => {
            if (!value) return Promise.resolve();
            const s = String(value || "").trim();
            const cleaned = (s.startsWith("+") ? "+" : "") + s.replaceAll(/[^0-9]/g, "");
            const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
            if (!/^[0-9]+$/.test(digits))
              return Promise.reject(new Error("Phone must contain only digits (and an optional leading +)."));
            if (digits.length < 7 || digits.length > 15)
              return Promise.reject(new Error("Phone number must be between 7 and 15 digits including country code."));
            return Promise.resolve();
          },
        }]}>
          <Input
            placeholder={country ? t("guestList.phonePlaceholder", "Include country code or national number") : t("guestList.selectCountryFirst", "Select country first")}
            disabled={!country}
            onBlur={(e) => {
              const v = e.target.value || "";
              const selectedCountry = form.getFieldValue("country");
              const isMX = /^\+?52/.test(v) || /^52\d{8,}$/.test(v) || /^521\d{8,}$/.test(v);
              form.setFieldsValue({ phone: formatPhone(v, selectedCountry || (isMX ? "MX" : undefined), countryCodes) });
            }}
          />
        </Form.Item>
        <Form.Item name="party_size" label={t("guestList.partySize", "Party size")} initialValue={1}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="relation_id" label={t("guestList.relation", "Relation")}>
          <Select allowClear>
            {relations.map((r) => (
              <Select.Option key={r.relation_id} value={r.relation_id}>{r.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="rsvp_status" label={t("guestList.rsvp", "RSVP")} initialValue="pending">
          <Select>
            <Select.Option value="pending">{t("guestList.pending", "Pending")}</Select.Option>
            <Select.Option value="attending">{t("guestList.attending", "Attending")}</Select.Option>
            <Select.Option value="maybe">{t("guestList.maybe", "Maybe")}</Select.Option>
            <Select.Option value="not_attending">{t("guestList.notAttending", "Not attending")}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="dietary_restrictions" label={t("guestList.dietaryRestrictions", "Dietary restrictions")}>
          <Input placeholder={t("guestList.commaSeparated", "Comma separated")} />
        </Form.Item>
        <Form.Item name="accesability_needs" label={t("guestList.accessibilityNeeds", "Accessibility needs")}>
          <Input />
        </Form.Item>
        <Form.Item name="notes" label={t("guestList.notes", "Notes")}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item>
          <div style={{ textAlign: "right" }}>
            <Button onClick={handleClose} style={{ marginRight: 8 }}>{t("guestList.cancel", "Cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={adding}>{t("guestList.add", "Add")}</Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddGuestModal;
