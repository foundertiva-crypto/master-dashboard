"use client";
import { useState } from "react";
import { Button, Card, Input, List, Space, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import useApi from "../../hooks/useApi";
const { Title, Text } = Typography;
type Message = { role: "user" | "assistant"; content: string };
export default function ChatPage() {
  const { post, loading } = useApi();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((items) => [...items, { role: "user", content: text }]);
    setInput("");
    const result = await post<{ reply?: string }>("/api/chat/send", { message: text, history: messages, provider: "openai" });
    setMessages((items) => [...items, { role: "assistant", content: result?.reply ?? "The chat service returned no reply." }]);
  }
  return <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
    <Title level={3}>TIVA Founder Chat</Title><Text type="secondary">Use this private workspace for approved company work.</Text>
    <Card style={{ marginTop: 16, minHeight: 360 }}><List dataSource={messages} locale={{ emptyText: "Start with one concrete founder need." }} renderItem={(message) => <List.Item><Space direction="vertical" style={{ width: "100%" }}><Text strong>{message.role === "user" ? "Founder" : "TIVA AI"}</Text><div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div></Space></List.Item>} /></Card>
    <Space.Compact style={{ display: "flex", marginTop: 16 }}><Input value={input} onChange={(event) => setInput(event.target.value)} onPressEnter={send} placeholder="Describe one task" aria-label="Founder request" /><Button type="primary" icon={<SendOutlined />} onClick={send} loading={loading}>Send</Button></Space.Compact>
  </div>;
}
