"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Statistic, Row, Col, Typography, Spin, Input } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";
import useApi from "../../../hooks/useApi";

const { Title } = Typography;

export default function CustomersPage() {
  const { get, loading } = useApi();
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    get("/api/erp/customers").then((r) => r && setData(r));
  }, [get]);

  if (loading && !data) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  const filtered = (data?.customers ?? []).filter((c: any) =>
    (c.customer_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: "Name", dataIndex: "customer_name", key: "customer_name" },
    { title: "ID", dataIndex: "name", key: "name" },
    { title: "Group", dataIndex: "customer_group", key: "customer_group" },
    { title: "Territory", dataIndex: "territory", key: "territory" },
    { title: "Created", dataIndex: "creation", key: "creation", render: (d: string) => d?.slice(0, 10) },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Customers</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="Total Customers" value={data?.totalCustomers ?? 0} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="New This Month" value={data?.newCustomersThisMonth ?? 0} valueStyle={{ color: "#3f8600" }} /></Card>
        </Col>
      </Row>
      <Card title="Customer List" extra={<Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 250 }} />}>
        <Table dataSource={filtered} columns={columns} rowKey="name" pagination={{ pageSize: 15 }} />
      </Card>
    </div>
  );
}
