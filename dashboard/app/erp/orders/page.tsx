"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Statistic, Row, Col, Typography, Spin, Tag } from "antd";
import { ShoppingCartOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import useApi from "../../../hooks/useApi";

const { Title } = Typography;

export default function OrdersPage() {
  const { get, loading } = useApi();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    get("/api/erp/orders").then((r) => r && setData(r));
  }, [get]);

  if (loading && !data) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  const columns = [
    { title: "Order", dataIndex: "name", key: "name" },
    { title: "Customer", dataIndex: "customer", key: "customer" },
    { title: "Amount", dataIndex: "grand_total", key: "grand_total", render: (v: number) => `$${Number(v || 0).toLocaleString()}` },
    { title: "Status", dataIndex: "status", key: "status", render: (s: string) => {
      const color = s === "Completed" ? "green" : s === "Draft" ? "default" : s === "Cancelled" ? "red" : "blue";
      return <Tag color={color}>{s}</Tag>;
    }},
    { title: "Order Date", dataIndex: "transaction_date", key: "transaction_date" },
    { title: "Delivery Date", dataIndex: "delivery_date", key: "delivery_date" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Orders</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="Total Orders" value={data?.totalOrders ?? 0} prefix={<ShoppingCartOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Pending" value={data?.pendingOrders ?? 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: "#cf1322" }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Completed" value={data?.completedOrders ?? 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#3f8600" }} /></Card>
        </Col>
      </Row>
      <Card title="All Orders">
        <Table dataSource={data?.orders ?? []} columns={columns} rowKey="name" pagination={{ pageSize: 15 }} />
      </Card>
    </div>
  );
}
