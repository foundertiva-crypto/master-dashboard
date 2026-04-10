"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Tabs, Tag, Button, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import useApi from "../../hooks/useApi";

const { Title } = Typography;

export default function LogsPage() {
  const { get, loading } = useApi();
  const [uploadLogs, setUploadLogs] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [erpLogs, setErpLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);

  async function fetchAll() {
    const [u, c, e, s] = await Promise.all([
      get<any[]>("/api/logs/uploads"),
      get<any[]>("/api/logs/chat"),
      get<any[]>("/api/logs/erp"),
      get<any[]>("/api/logs/system"),
    ]);
    if (u) setUploadLogs(u);
    if (c) setChatLogs(c);
    if (e) setErpLogs(e);
    if (s) setSystemLogs(s);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const levelColor = (l: string) => {
    if (l === "error") return "red";
    if (l === "warn") return "orange";
    return "blue";
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          System Logs
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>
          Refresh All
        </Button>
      </div>

      <Tabs
        items={[
          {
            key: "upload",
            label: `Uploads (${uploadLogs.length})`,
            children: (
              <Table
                dataSource={uploadLogs}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 20 }}
                columns={[
                  { title: "File", dataIndex: "file_name", key: "file_name" },
                  { title: "Type", dataIndex: "upload_type", key: "upload_type" },
                  { title: "Rows", dataIndex: "total_rows", key: "total_rows" },
                  { title: "OK", dataIndex: "success_rows", key: "success_rows" },
                  { title: "Fail", dataIndex: "failed_rows", key: "failed_rows" },
                  {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    render: (s: string) => (
                      <Tag color={s === "completed" ? "green" : s === "failed" ? "red" : "blue"}>
                        {s}
                      </Tag>
                    ),
                  },
                  {
                    title: "Time",
                    dataIndex: "created_at",
                    key: "created_at",
                    render: (d: string) => new Date(d).toLocaleString(),
                  },
                ]}
              />
            ),
          },
          {
            key: "chat",
            label: `Chat (${chatLogs.length})`,
            children: (
              <Table
                dataSource={chatLogs}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 20 }}
                columns={[
                  { title: "Session", dataIndex: "session_id", key: "session_id", ellipsis: true },
                  { title: "Role", dataIndex: "role", key: "role" },
                  { title: "Content", dataIndex: "content", key: "content", ellipsis: true },
                  { title: "Tokens", dataIndex: "tokens_used", key: "tokens_used" },
                  { title: "Model", dataIndex: "model", key: "model" },
                  {
                    title: "Time",
                    dataIndex: "created_at",
                    key: "created_at",
                    render: (d: string) => new Date(d).toLocaleString(),
                  },
                ]}
              />
            ),
          },
          {
            key: "erp",
            label: `ERP (${erpLogs.length})`,
            children: (
              <Table
                dataSource={erpLogs}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 20 }}
                columns={[
                  { title: "Method", dataIndex: "method", key: "method" },
                  { title: "Endpoint", dataIndex: "endpoint", key: "endpoint" },
                  {
                    title: "Status",
                    dataIndex: "status_code",
                    key: "status_code",
                    render: (s: number) => (
                      <Tag color={s && s < 400 ? "green" : "red"}>{s ?? "?"}</Tag>
                    ),
                  },
                  { title: "Time (ms)", dataIndex: "response_time_ms", key: "response_time_ms" },
                  { title: "Error", dataIndex: "error_message", key: "error_message", ellipsis: true },
                  {
                    title: "Time",
                    dataIndex: "created_at",
                    key: "created_at",
                    render: (d: string) => new Date(d).toLocaleString(),
                  },
                ]}
              />
            ),
          },
          {
            key: "system",
            label: `System (${systemLogs.length})`,
            children: (
              <Table
                dataSource={systemLogs}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 20 }}
                columns={[
                  {
                    title: "Level",
                    dataIndex: "level",
                    key: "level",
                    render: (l: string) => <Tag color={levelColor(l)}>{l}</Tag>,
                  },
                  { title: "Source", dataIndex: "source", key: "source" },
                  { title: "Action", dataIndex: "action", key: "action" },
                  { title: "Message", dataIndex: "message", key: "message", ellipsis: true },
                  {
                    title: "Time",
                    dataIndex: "created_at",
                    key: "created_at",
                    render: (d: string) => new Date(d).toLocaleString(),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
