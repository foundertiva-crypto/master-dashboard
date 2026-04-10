"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Statistic, Row, Col, Tag, Typography, Spin } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import useApi from "../../../hooks/useApi";

const { Title } = Typography;

export default function SalesPage() {
  const { get, loading } = useApi();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    get("/api/erp/sales").then((r) => r && setData(r));
  }, [get]);

  if (loading && !data) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  const columns = [
    { title: "Order", dataIndex: "name", key: "name" },
    { title: "Customer", dataIndex: "customer", key: "customer" },
    { title: "Amount", dataIndex: "grand_total", key: "grand_total", render: (v: number) => `$${Number(v || 0).toLocaleString()}` },
    { title: "Status", dataIndex: "status", key: "status", render: (s: string) => <Tag color={s === "Completed" ? "green" : "blue"}>{s}</Tag> },
    { title: "Date", dataIndex: "transaction_date", key: "transaction_date" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Sales Overview</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="Today's Sales" value={data?.todaySales ?? 0} prefix={<DollarOutlined />} precision={2} valueStyle={{ color: "#3f8600" }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Total Sales" value={data?.totalSales ?? 0} prefix="$" precision={2} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Orders Today" value={data?.salesCount ?? 0} /></Card>
        </Col>
      </Row>
      <Card title="Recent Sales Orders">
        <Table dataSource={data?.recentOrders ?? []} columns={columns} rowKey="name" pagination={{ pageSize: 15 }} />
      </Card>
    </div>
  );
}
