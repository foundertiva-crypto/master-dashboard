"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Statistic, Row, Col, Typography, Spin, Tag } from "antd";
import { FileTextOutlined, DollarOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import useApi from "../../../hooks/useApi";

const { Title } = Typography;

export default function InvoicesPage() {
  const { get, loading } = useApi();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    get("/api/erp/invoices").then((r) => r && setData(r));
  }, [get]);

  if (loading && !data) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  const columns = [
    { title: "Invoice", dataIndex: "name", key: "name" },
    { title: "Customer", dataIndex: "customer", key: "customer" },
    { title: "Total", dataIndex: "grand_total", key: "grand_total", render: (v: number) => `$${Number(v || 0).toLocaleString()}` },
    { title: "Outstanding", dataIndex: "outstanding_amount", key: "outstanding_amount", render: (v: number) => {
      const amt = Number(v || 0);
      return amt > 0 ? <span style={{ color: "#cf1322" }}>${amt.toLocaleString()}</span> : "$0";
    }},
    { title: "Status", dataIndex: "status", key: "status", render: (s: string) => {
      const color = s === "Paid" ? "green" : s === "Overdue" ? "red" : s === "Unpaid" ? "orange" : "blue";
      return <Tag color={color}>{s}</Tag>;
    }},
    { title: "Date", dataIndex: "posting_date", key: "posting_date" },
    { title: "Due", dataIndex: "due_date", key: "due_date" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Invoices</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="Total Invoices" value={data?.totalInvoices ?? 0} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Unpaid" value={data?.unpaidInvoices ?? 0} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: "#cf1322" }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Outstanding" value={data?.totalOutstanding ?? 0} prefix={<DollarOutlined />} precision={2} valueStyle={{ color: "#cf1322" }} /></Card>
        </Col>
      </Row>
      <Card title="All Invoices">
        <Table dataSource={data?.invoices ?? []} columns={columns} rowKey="name" pagination={{ pageSize: 15 }} />
      </Card>
    </div>
  );
}
