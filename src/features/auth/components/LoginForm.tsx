"use client";

import React from "react";
import { Form, Input, Button } from "antd";
import { useTranslation } from "react-i18next";
import type { LoginCredentials } from "../models/auth.models";
import styles from "../LoginPage.module.css";

interface LoginFormProps {
  onSubmit: (values: LoginCredentials) => Promise<void> | void;
  loading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
}) => {
  const { t } = useTranslation();

  return (
    <Form
      layout="vertical"
      onFinish={(values) => onSubmit(values as LoginCredentials)}
      requiredMark={false}
    >
      <Form.Item
        name="email"
        label={t("auth.email")}
        rules={[
          { required: true, type: "email", message: t("auth.validEmail") },
        ]}
      >
        <Input
          placeholder={t("auth.emailPlaceholder")}
          size="large"
          autoComplete="email"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label={t("auth.password")}
        rules={[{ required: true, message: t("auth.passwordRequired") }]}
      >
        <Input.Password
          placeholder={t("auth.passwordPlaceholder")}
          size="large"
          autoComplete="current-password"
        />
      </Form.Item>

      <Form.Item className={styles.submitItem}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
        >
          {t("auth.signIn")}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
