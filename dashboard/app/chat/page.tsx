"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, Input, Button, List, Typography, Space, Avatar, Spin, Select, Tag } from "antd";
import { SendOutlined, RobotOutlined, UserOutlined, DeleteOutlined } from "@ant-design/icons";
import { v4 as uuid } from "uuid";
import useApi from "../../hooks/useApi";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
}

export default function ChatPage() {
  const { get, post, loading } = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => uuid());
  const [provider, setProvider] = useState<string>("openai");
  const [availableProviders, setAvailableProviders] = useState<string[]>(["openai"]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    get<{ providers: string[]; default: string }>("/api/chat/providers").then((r) => {
      if (r) {
        setAvailableProviders(r.providers);
        setProvider(r.default || "openai");
      }
    });
  }, [get]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    const response = await post<{
      reply: string;
      tokensUsed: number;
      model: string;
      provider: string;
    }>("/api/chat/send", { message: text, sessionId, history, provider });

    if (response) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          timestamp: new Date(),
          provider: response.provider,
          model: response.model,
        },
      ]);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Tiva AI Assistant
        </Title>
        <Space>
          <Text type="secondary">Provider:</Text>
          <Select
            value={provider}
            onChange={setProvider}
            style={{ width: 140 }}
            options={availableProviders.map((p) => ({
              value: p,
              label: p === "claude" ? "Claude" : "OpenAI",
            }))}
          />
          <Button icon={<DeleteOutlined />} onClick={() => setMessages([])} disabled={messages.length === 0}>
            Clear
          </Button>
        </Space>
      </Space>

      <Card
        style={{ height: "60vh", overflowY: "auto", marginBottom: 16 }}
        styles={{ body: { padding: 16 } }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
            <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <Paragraph>Ask about your ERP data, bulk uploads, Tiva upgrades, or anything business-related.</Paragraph>
            <Paragraph type="secondary">Using: {provider === "claude" ? "Claude (Anthropic)" : "OpenAI GPT-4o"}</Paragraph>
          </div>
        )}

        <List
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item
              style={{
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                border: "none",
                padding: "8px 0",
              }}
            >
              <Space align="start">
                {msg.role === "assistant" && (
                  <Avatar
                    icon={<RobotOutlined />}
                    style={{ backgroundColor: msg.provider === "claude" ? "#d4380d" : "#1890ff" }}
                  />
                )}
                <Card
                  size="small"
                  style={{
                    maxWidth: 600,
                    backgroundColor: msg.role === "user" ? "#e6f7ff" : "#f6f6f6",
                  }}
                >
                  <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </Paragraph>
                  <Space style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {msg.timestamp.toLocaleTimeString()}
                    </Text>
                    {msg.model && (
                      <Tag style={{ f