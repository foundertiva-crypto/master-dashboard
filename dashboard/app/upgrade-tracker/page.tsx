"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Progress,
  Row,
  Col,
  Typography,
  Spin,
  Select,
  Button,
  Space,
  Tabs,
  Statistic,
  Badge,
  message,
} from "antd";
import {
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import useApi from "../../hooks/useApi";

const { Title, Text } = Typography;

interface PhaseOverview {
  phase: number;
  name: string;
  description: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  pending: number;
  percentComplete: number;
}

export default function UpgradeTrackerPage() {
  const { get, post, loading } = useApi();
  const [phases, setPhases] = useState<PhaseOverview[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [seeded, setSeeded] = useState(false);

  async function fetchData() {
    const [p, r] = await Promise.all([
      get<PhaseOverview[]>("/api/tracker/phases"),
      get<any[]>("/api/tracker/requirements"),
    ]);
    if (p) setPhases(p);
    if (r) setRequirements(r);
  }

  async function seedRoadmap() {
    const res = await post("/api/tracker/seed", {});
    if (res) {
      message.success("Tiva roadmap seeded!");
      setSeeded(true);
      fetchData();
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const statusTag = (s: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      completed: { color: "green", icon: <CheckCircleOutlined /> },
      in_progress: { color: "blue", icon: <SyncOutlined spin /> },
      blocked: { color: "red", icon: <ExclamationCircleOutlined /> },
      pending: { color: "default", icon: <ClockCircleOutlined /> },
    };
    const m = map[s] || map.pending;
    return <Tag icon={m.icon} color={m.color}>{s.replace("_", " ")}</Tag>;
  };

  const priorityTag = (p: string) => {
    const colors: Record<string, string> = { critical: "red", high: "orange", medium: "blue", low: "default" };
    return <Tag color={colors[p] || "default"}>{p}</Tag>;
  };

  const phaseColors = ["#52c41a", "#1890ff", "#fa8c16"];

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", width: 280 },
    { title: "Category", dataIndex: "category", key: "category", render: (c: string) => <Tag>{c}</Tag> },
    { title: "Priority", dataIndex: "priority", key: "priority", render: priorityTag },
    { title: "Status", dataIndex: "status", key: "status", render: statusTag },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
  ];

  if (loading && phases.length === 0) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <RocketOutlined /> Tiva Upgrade Tracker
        </Title>
        <Space>
          {!seeded && requirements.length === 0 && (
            <Button type="primary" onClick={seedRoadmap} loading={loading}>
              Seed Tiva Roadmap
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        </Space>
      </Space>

      {/* Phase overview cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {phases.map((p, i) => (
          <Col xs={24} lg={8} key={p.phase}>
            <Card
              title={
                <Space>
                  <Badge color={phaseColors[i]} />
                  <span>Phase {p.phase}: {p.name}</span>
                </Space>
              }
              size="small"
            >
              <Text type="secondary">{p.description}</Text>
              <Progress
                percent={p.percentComplete}
                status={p.percentComplete === 100 ? "success" : "active"}
                style={{ marginTop: 12 }}
              />
              <Row gutter={8} style={{ marginTop: 12 }}>
                <Col span={6}><Statistic title="Done" value={p.completed} valueStyle={{ fontSize: 18, color: "#52c41a" }} /></Col>
                <Col span={6}><Statistic title="Active" value={p.inProgress} valueStyle={{ fontSize: 18, color: "#1890ff" }} /></Col>
                <Col span={6}><Statistic title="Blocked" value={p.blocked} valueStyle={{ fontSize: 18, color: "#cf1322" }} /></Col>
                <Col span={6}><Statistic title="Pending" value={p.pending} valueStyle={{ fontSize: 18 }} /></Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Requirements table by phase */}
      <Tabs
        items={[1, 2, 3].map((phase) => ({
          key: String(phase),
          label: `Phase ${phase}`,
          children: (
            <Card>
              <Table
                dataSource={requirements.filter((r) => r.phase === phase)}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          ),
        }))}
      />
    </div>
  );
}
