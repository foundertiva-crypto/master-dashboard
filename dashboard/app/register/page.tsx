"use client";

import React from "react";
import { useRegister } from "@refinedev/core";
import { Form, Input, Button, Card, Typography, Space, Divider, message, Layout } from "antd";
import { LockOutlined, MailOutlined, UserOutlined, DashboardOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { mutate: register, isLoading } = useRegister();
  const [form] = Form.useForm();

  const onFinish = (values: { email: string; password: string; fullName: string }) => {
    register(values, {
      onError: (err) => {
        message.error(err?.message || "Registration failed");
      },
      onSuccess: () => {
        message.success("Account created! Please login.");
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
            Create Account
          </Title>
          <Text type="secondary">Register for Master Dashboard</Text>
        </Space>

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="fullName"
            rules={[{ required: true, message: "Enter your full name" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full Name" />
          </Form.Item>

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
            rules={[
              { required: true, message: "Enter a password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">or</Text>
        </Divider>

        <div style={{ textAlign: "center" }}>
          <Link href="/login">
            <Text type="secondary">
              Already have an account? <Text strong>Sign in</Text>
            </Text>
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
