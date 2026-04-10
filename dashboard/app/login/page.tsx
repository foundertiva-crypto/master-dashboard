"use client";

import React from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Card, Typography, Space, Divider, message, Layout } from "antd";
import { LockOutlined, MailOutlined, DashboardOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { mutate: login, isLoading } = useLogin();
  const [form] = Form.useForm();

  const onFinish = (values: { email: string; password: string }) => {
    login(values, {
      onError: (err) => {
        message.error(err?.message || "Login failed");
      },
    });
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          borderRadius: 12,
        }}
      >
        <Space
          direction="vertical"
          style={{ width: "100%", textAlign: "center", marginBottom: 24 }}
        >
          <DashboardOutlined style={{ fontSize: 48, color: "#1890ff" }} />
          <Title level={3} style={{ margin: 0 }}>
            Master Dashboard
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </Space>

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Enter your email" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email address" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Enter your password" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">or</Text>
        </Divider>

        <div style={{ textAlign: "center" }}>
          <Link href="/register">
            <Text type="secondary">
              Don&apos;t have an account? <Text strong>Register here</Text>
            </Text>
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
