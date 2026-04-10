"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Statistic, Row, Col, Typography, Spin, Tag, Badge } from "antd";
import { InboxOutlined, WarningOutlined } from "@ant-design/icons";
import useApi from "../../../hooks/useApi";

const { Title, Text } = Typography;

export default function InventoryPage() {
  const { get, loading } = useApi();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    get("/api/erp/inventory").then((r) => r && setData(r));
  }, [get]);

  if (loading && !data) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  const columns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    { title: "Code", dataIndex: "name", key: "name" },
    { title: "Group", dataIndex: "item_group", key: "item_group" },
    { title: "In Stock", dataIndex: "actualQty", key: "actualQty", render: (v: number, r: any) => {
      const low = r.safety_stock && v < parseFloat(r.safety_stock);
      return low ? <Text type="danger">{v} <WarningOutlined /></Text> : v;
    }},
    { title: "Safety Stock", dataIndex: "safety_stock", key: "safety_stock" },
    { title: "Rate", dataIndex: "standard_rate", key: "standard_rate", render: (v: number) => `$${Number(v || 0).toFixed(2)}` },
    { title: "UOM", dataIndex: "stock_uom", key: "stock_uom" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Inventory</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="Total Items" value={data?.totalItems ?? 0} prefix={<InboxOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Total Value" value={data?.totalValue ?? 0} prefix="$" precision={2} /></Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Low Stock Alerts" value={data?.lowStockItems?.length ?? 0} valueStyle={{ color: "#cf1322" }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
      </Row>
      {data?.lowStockItems?.length > 0 && (
        <Card title={<><WarningOutlined style={{ color: "#faad14" }} /> Low Stock Items <Badge count={data.lowStockItems.length} style={{ backgroundColor: "#faad14", marginLeft: 8 }} /></>} style={{ marginBottom: 16 }}>
          <Table dataSource={data.lowStockItems} columns={columns} rowKey="name" pagination={false} size="small" />
        </Card>
      )}
      <Card title="All Inventory Items">
        <Table dataSource={data?.items ?? []} columns={columns} rowKey="name" pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  );
}
