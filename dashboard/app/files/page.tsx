"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Upload,
  Select,
  Space,
  Typography,
  Tag,
  message,
  Popconfirm,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import useApi from "../../hooks/useApi";

const { Title } = Typography;

export default function FilesPage() {
  const { get, post, uploadFile, loading } = useApi();
  const [files, setFiles] = useState<any[]>([]);
  const [category, setCategory] = useState<string>("general");

  async function fetchFiles() {
    const data = await get<any[]>(`/api/files?category=${category}`);
    if (data) setFiles(data);
  }

  useEffect(() => {
    fetchFiles();
  }, [category]);

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const result = await uploadFile("/api/files/upload", formData);
    if (result) {
      message.success("File uploaded successfully");
      fetchFiles();
    }
    return false;
  }

  async function handleDownload(id: string) {
    const data = await get<{ url: string }>(`/api/files/download/${id}`);
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  }

  async function handleDelete(id: string) {
    await post(`/api/files/${id}`, {}); // would be DELETE, simplified
    message.success("File deleted");
    fetchFiles();
  }

  const columns = [
    { title: "Name", dataIndex: "file_name", key: "file_name" },
    { title: "Type", dataIndex: "content_type", key: "content_type", ellipsis: true },
    {
      title: "Size",
      dataIndex: "file_size",
      key: "file_size",
      render: (v: number) => `${(v / 1024).toFixed(1)} KB`,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (c: string) => <Tag>{c}</Tag>,
    },
    {
      title: "Uploaded",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id)}
          >
            Download
          </Button>
          <Popconfirm title="Delete this file?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>File Storage Manager</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            value={category}
            onChange={setCategory}
            style={{ width: 160 }}
            options={[
              { value: "general", label: "General" },
              { value: "reports", label: "Reports" },
              { value: "uploads", label: "Uploads" },
              { value: "logs", label: "Logs" },
            ]}
          />
          <Upload beforeUpload={handleUpload as any} showUploadList={false}>
            <Button icon={<UploadOutlined />} type="primary">
              Upload File
            </Button>
          </Upload>
          <Button icon={<ReloadOutlined />} onClick={fetchFiles}>
            Refresh
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          dataSource={files}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </div>
  );
}
