"use client";

import { Typography, Alert } from "antd";
import { useAuth } from "@/shared/contexts/AuthContext";
import Card from "@/shared/components/Card/Card";
import { LoginForm } from "./components/LoginForm";
import { useLogin } from "./hooks/useLogin";
import styles from "./LoginPage.module.css";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { sessionExpired } = useAuth();
  const { handleLogin, loading, error } = useLogin();
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <img src="/weddia-logo.svg" alt="Wedd.IA" className={styles.logo} />
          <Title level={4} className={styles.title}>
            {t("auth.title")}
          </Title>
          <Text type="secondary">{t("auth.subtitle")}</Text>
        </div>

        {sessionExpired && (
          <Alert
            className={styles.alert}
            title={t("auth.sessionExpiredTitle")}
            description={t("auth.sessionExpiredDesc")}
            type="warning"
            showIcon
          />
        )}

        {error && (
          <Alert className={styles.alert} title={error} type="error" showIcon />
        )}

        <LoginForm onSubmit={handleLogin} loading={loading} />
      </Card>
    </div>
  );
}

