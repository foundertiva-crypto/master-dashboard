"use client";

import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Alert,
  Spin,
  Typography,
  Space,
  Badge,
} from "antd";
import {
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import useApi from "../../hooks/useApi";

const { Title, Text } = Typography;

interface DashboardData {
  sales: {
    totalSales: number;
    todaySales: number;
    salesCount: number;
    recentOrders: any[];
  };
  customers: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    customers: any[];
  };
  inventory: {
    totalItems: number;
    lowStockItems: any[];
    totalValue: number;
    items: any[];
  };
  orders: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    orders: any[];
  };
  invoices: {
    totalInvoices: number;
    unpaidInvoices: number;
    totalOutstanding: number;
    invoices: any[];
  };
}

export default function DashboardPage() {
  const { get, loading, error } = useApi();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      const result = await get<DashboardData>("/api/erp/dashboard");
      if (result) setData(result);
    }
    fetchDashboard();
  }, [get]);

  if (loading && !data) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading ERP data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert
        type="warning"
        message="Could not load ERP data"
        description={error}
        showIcon
        style={{ margin: 24 }}
      />
    );
  }

  const orderColumns = [
    { title: "Order", dataIndex: "name", key: "name" },
    { title: "Customer", dataIndex: "customer", key: "customer" },
    {
      title: "Amount",
      dataIndex: "grand_total",
      key: "grand_total",
      render: (v: number) => `$${Number(v || 0).toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const color =
          s === "Completed" ? "green" : s === "Draft" ? "default" : "blue";
        return <Tag color={color}>{s}</Tag>;
      },
    },
    { title: "Date", dataIndex: "transaction_date", key: "transaction_date" },
  ];

  const lowStockColumns = [
    { title: "Item", dataIndex: "item_name", key: "item_name" },
    { title: "Code", dataIndex: "name", key: "name" },
    {
      title: "Current Qty",
      dataIndex: "actualQty",
      key: "actualQty",
      render: (v: number) => <Text type="danger">{v}</Text>,
    },
    {
      title: "Safety Stock",
      dataIndex: "safety_stock",
      key: "safety_stock",
    },
    { title: "Group", dataIndex: "item_group", key: "item_group" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>ERP Overview</Title>

      {/* ---- KPI Cards ---- */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Today's Sales"
              value={data?.sales.todaySales ?? 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#3f8600" }}
            />
            <Text type="secondary">{data?.sales.salesCount ?? 0} orders today</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Customer Count"
              value={data?.customers.totalCustomers ?? 0}
              prefix={<UserOutlined />}
            />
            <Text type="secondary">
              +{data?.customers.newCustomersThisMonth ?? 0} this month
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Inventory Items"
              value={data?.inventory.totalItems ?? 0}
              prefix={<InboxOutlined />}
            />
            <Text type="secondary">
              Value: ${Number(data?.inventory.totalValue ?? 0).toLocaleString()}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Pending Orders"
              value={data?.orders.pendingOrders ?? 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
            <Text type="secondary">
              <CheckCircleOutlined /> {data?.orders.completedOrders ?? 0} completed
            </Text>
          </Card>
        </Col>
      </Row>

      {/* ---- Low Stock Alerts ---- */}
      {data?.inventory.lowStockItems && data.inventory.lowStockItems.length > 0 && (
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: "#faad14" }} />
              <span>Low Stock Alerts</span>
              <Badge count={data.inventory.lowStockItems.length} style={{ backgroundColor: "#faad14" }} />
            </Space>
          }
          style={{ marginTop: 16 }}
        >
          <Table
            dataSource={data.inventory.lowStockItems.slice(0, 10)}
            columns={lowStockColumns}
            rowKey="name"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* ---- Invoices Summary ---- */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Invoices"
              value={data?.invoices.totalInvoices ?? 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Unpaid Invoices"
              value={data?.invoices.unpaidInvoices ?? 0}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Outstanding Amount"
              value={data?.invoices.totalOutstanding ?? 0}
              prefix="$"
              precision={2}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* ---- Recent Orders Table ---- */}
      <Card title="Recent Orders" style={{ marginTop: 16 }}>
        <Table
          dataSource={data?.orders.orders ?? []}
          columns={orderColumns}
          rowKey="name"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
