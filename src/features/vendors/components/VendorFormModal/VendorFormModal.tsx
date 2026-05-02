"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Switch } from "antd";
import { PhoneOutlined, MailOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { Vendor } from "@/shared/models/vendor.models";
import type { VendorFormValues } from "../../models/vendor.models";
import { VENDOR_CATEGORIES } from "../../constants/vendor.constants";
import styles from "./VendorFormModal.module.css";

interface VendorFormModalProps {
  open: boolean;
  editingVendor: Vendor | null;
  onSave: (values: VendorFormValues) => Promise<boolean>;
  onCancel: () => void;
}

export const VendorFormModal = ({ open, editingVendor, onSave, onCancel }: VendorFormModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<VendorFormValues>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingVendor) {
      form.setFieldsValue({
        name:         editingVendor.name,
        category:     editingVendor.category,
        contact_name: editingVendor.contact_name,
        phone:        editingVendor.phone,
        email:        editingVendor.email,
        address:      editingVendor.address,
        notes:        editingVendor.notes,
        is_active:    editingVendor.is_active !== false,
      });
    } else {
      form.resetFields();
      form.setFieldValue("is_active", true);
    }
  }, [open, editingVendor, form]);

  const handleOk = async () => {
    let values: VendorFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(values);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={editingVendor ? t("vendorCatalog.edit") : t("vendorList.addVendor")}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={editingVendor ? t("common.save") : t("common.create")}
      cancelText={t("common.cancel")}
      confirmLoading={isSaving}
      width={520}
      forceRender
      destroyOnHidden={false}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <div className={styles.amountSection}>
          <Form.Item
            name="name"
            label={t("vendorList.form.vendorName")}
            rules={[{ required: true, message: t("vendorList.form.vendorName") }]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder={t("vendorList.form.vendorNamePlaceholder")}
              className={styles.nameInput}
            />
          </Form.Item>
        </div>

        <div className={`${styles.paymentSection} mb-12`}>
          <p className={styles.sectionLabel}>{t("vendorList.form.category")}</p>
          <Form.Item name="category" noStyle>
            <Select
              placeholder={t("vendorList.form.categoryPlaceholder")}
              className="w-full"
              options={VENDOR_CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </Form.Item>
        </div>

        <div className={styles.paymentSection} style={{ marginBottom: 12 }}>
          <p className={styles.sectionLabel}>
            <UserOutlined className="mr-6" />
            {t("vendorList.form.contactPerson")}
          </p>
          <div className={styles.twoCol}>
            <Form.Item name="contact_name" label={t("vendorList.form.contactPerson")} className="mb-0">
              <Input placeholder={t("vendorList.form.contactPlaceholder")} />
            </Form.Item>
            <Form.Item name="phone" label={t("vendorList.form.phone")} className="mb-0">
              <Input placeholder={t("vendorList.form.phonePlaceholder")} prefix={<PhoneOutlined />} />
            </Form.Item>
          </div>
          <Form.Item name="email" label={t("vendorList.form.email")} className="mb-0 mt-10">
            <Input type="email" placeholder={t("vendorList.form.emailPlaceholder")} prefix={<MailOutlined />} />
          </Form.Item>
        </div>

        <div className={styles.paymentSection}>
          <p className={styles.sectionLabel}>
            <EnvironmentOutlined className="mr-6" />
            {t("vendorList.form.address")}
          </p>
          <Form.Item name="address" className="mb-10">
            <Input placeholder={t("vendorList.form.addressPlaceholder")} />
          </Form.Item>
          <Form.Item name="notes" className="mb-0">
            <Input.TextArea rows={2} placeholder={t("vendorList.form.notesPlaceholder")} />
          </Form.Item>
        </div>

        {editingVendor && (
          <div className={styles.paymentSection} style={{ marginTop: 12 }}>
            <Form.Item
              name="is_active"
              label={t("vendorList.columns.status")}
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch
                checkedChildren={t("vendorList.active")}
                unCheckedChildren={t("vendorList.inactive")}
              />
            </Form.Item>
          </div>
        )}
      </Form>
    </Modal>
  );
};
