"use client";

import React from "react";
import { Refine } from "@refinedev/core";
import { RefineThemes, ThemedLayoutV2, ThemedSiderV2, ThemedTitleV2 } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import { App as AntdApp, ConfigProvider } from "antd";
import {
  DashboardOutlined,
  UploadOutlined,
  MessageOutlined,
  FolderOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
  RocketOutlined,
} from "@ant-design/icons";

import { authProvider } from "../providers/auth-provider";
import { dataProvider } from "../providers/data-provider";

import "@refinedev/antd/dist/reset.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Tiva Master Dashboard</title>
        <meta name="description" content="Tiva Master Dashboard — ERPNext Integration" />
      </head>
      <body>
        <ConfigProvider theme={RefineThemes.Blue}>
          <AntdApp>
            <Refine
              routerProvider={routerProvider}
              dataProvider={dataProvider}
              authProvider={authProvider}
              resources={[
                {
                  name: "dashboard",
                  list: "/dashboard",
                  meta: { label: "Dashboard", icon: <DashboardOutlined /> },
                },
                {
                  name: "erp",
                  meta: { label: "ERP Data", icon: <AuditOutlined /> },
                },
                {
                  name: "erp/sales",
                  list: "/erp/sales",
                  meta: { label: "Sales", icon: <DollarOutlined />, parent: "erp" },
                },
                {
                  name: "erp/customers",
                  list: "/erp/customers",
                  meta: { label: "Customers", icon: <UserOutlined />, parent: "erp" },
                },
                {
                  name: "erp/inventory",
                  list: "/erp/inventory",
                  meta: { label: "Inventory", icon: <InboxOutlined />, parent: "erp" },
                },
                {
                  name: "erp/orders",
                  list: "/erp/orders",
                  meta: { label: "Orders", icon: <ShoppingCartOutlined />, parent: "erp" },
                },
                {
                  name: "erp/invoices",
                  list: "/erp/invoices",
                  meta: { label: "Invoices", icon: <FileTextOutlined />, parent: "erp" },
                },
                {
                  name: "bulk-upload",
                  list: "/bulk-upload",
                  meta: { label: "Bulk Upload", icon: <UploadOutlined /> },
                },
                {
                  name: "