"use client";

import React, { useState } from "react";
import { Form, Input, Button, Typography, Alert } from "antd";
import { useAuth } from "@/app/contexts/AuthContext";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login, sessionExpired } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary, #f0f2f5)",
      }}
    >
      <div
        style={{
          width: 360,
          padding: 40,
          background: "var(--card-bg, #fff)",
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/weddia-logo.svg" alt="Wedd.IA" style={{ height: 48, marginBottom: 16 }} />
          <Title level={4} style={{ margin: 0 }}>Sign in to continue</Title>
          <Text type="secondary">RBR Planning System</Text>
        </div>

        {sessionExpired && (
          <Alert
            title="Tu sesión expiró"
            description="Por seguridad, inicia sesión nuevamente para continuar."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {error && (
          <Alert title={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email", message: "Enter a valid email" }]}
          >
            <Input placeholder="admin@example.com" size="large" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Enter your password" }]}
          >
            <Input.Password placeholder="••••••••" size="large" autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
