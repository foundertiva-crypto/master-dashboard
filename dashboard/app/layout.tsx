"use client";
import React from "react";
import { Refine } from "@refinedev/core";
import { RefineThemes, ThemedLayoutV2 } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import { App as AntdApp, ConfigProvider } from "antd";
import { DashboardOutlined, MessageOutlined, UploadOutlined } from "@ant-design/icons";
import { authProvider } from "../providers/auth-provider";
import { dataProvider } from "../providers/data-provider";
import "@refinedev/antd/dist/reset.css";
export const dynamic = "force-dynamic";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><title>TIVA Founder Console</title><meta name="description" content="Private TIVA founder workspace" /></head><body><ConfigProvider theme={RefineThemes.Blue}><AntdApp><Refine routerProvider={routerProvider} dataProvider={dataProvider} authProvider={authProvider} resources={[{ name: "dashboard", list: "/dashboard", meta: { label: "Home", icon: <DashboardOutlined /> } }, { name: "chat", list: "/chat", meta: { label: "Founder Chat", icon: <MessageOutlined /> } }, { name: "bulk-upload", list: "/bulk-upload", meta: { label: "Document Intake", icon: <UploadOutlined /> } }]}><ThemedLayoutV2>{children}</ThemedLayoutV2></Refine></AntdApp></ConfigProvider></body></html>;
}
