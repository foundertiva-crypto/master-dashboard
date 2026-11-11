"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Upload,
  Button,
  Select,
  Table,
  Tag,
  Alert,
  Progress,
  Typography,
  Space,
  Divider,
  message,
  Tabs,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import useApi from "../../hooks/useApi";

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface UploadType {
  type: string;
  columns: string[];
}

interface PreviewData {
  fileName: string;
  fileSize: number;
  headers: string[];
  totalRows: number;
  preview: Record<string, any>[];
  validation: {
    valid: boolean;
    errorCount: number;
    errors: { row: number; field: string; message: string }[];
    validRowCount: number;
  } | null;
}

interface UploadResult {
  logId: string;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: { row: number; message: string }[];
  status: string;
}

export default function BulkUploadPage() {
  const { get, post, uploadFile, loading, error } = useApi();
  const [uploadTypes, setUploadTypes] = useState<UploadType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTypes() {
      const types = await get<UploadType[]>("/api/upload/types");
      if (types) setUploadTypes(types);
    }
    fetchTypes();
    fetchLogs();
  }, [get]);

  async function fetchLogs() {
    const data = await get<any[]>("/api/upload/logs");
    if (data) setLogs(data);
  }

  async function handlePreview() {
    if (!selectedFile || !selectedType) {
      message.warning("Select a file and upload type first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("uploadType", selectedType);

    const data = await uploadFile<PreviewData>("/api/upload/preview", formData);
    if (data) {
      setPreview(data);
      setResult(null);
    }
  }

  async function handleProcess() {
    if (!selectedFile || !selectedType) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("uploadType", selectedType);

    const data = await uploadFile<UploadResult>("/api/upload/process", formData);
    if (data) {
      setResult(data);
      message.success(`Upload complete: ${data.succeeded} succeeded, ${data.failed} failed`);
      fetchLogs();
    }
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const logColumns = [
    { title: "File", dataIndex: "file_name", key: "file_name" },
    { title: "Type", dataIndex: "upload_type", key: "upload_type" },
    { title: "Total", dataIndex: "total_rows", key: "total_rows" },
    {
      title: "Success",
      dataIndex: "success_rows",
      key: "success_rows",
      render: (v: number) => <Text type="success">{v}</Text>,
    },
    {
      title: "Failed",
      dataIndex: "failed_rows",
      key: "failed_rows",
      render: (v: number) => (v > 0 ? <Text type="danger">{v}</Text> : 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const color =
          s === "completed" ? "green" : s === "failed" ? "red" : "blue";
        return <Tag color={color}>{s}</Tag>;
      },
    },
    { title: "Date", dataIndex: "created_at", key: "created_at", render: (d: string) => new Date(d).toLocaleString() },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Bulk Upload Manager</Title>

      <Tabs
        items={[
          {
            key: "upload",
            label: "Upload",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                {/* Type + Template */}
                <Card title="Step 1: Select Upload Type">
                  <Space>
                    <Select
                      style={{ width: 220 }}
                      placeholder="Select type..."
                      value={selectedType || undefined}
                      onChange={setSelectedType}
                      options={uploadTypes.map((t) => ({
                        value: t.type,
                        label: t.type.charAt(0).toUpperCase() + t.type.slice(1),
                      }))}
                    />
                    {selectedType && (
                      <Button
                        icon={<DownloadOutlined />}
                        href={`${API_URL}/api/upload/template/${selectedType}?format=csv`}
                      >
                        Download CSV Template
                      </Button>
                    )}
                    {selectedType && (
                      <Button
                        icon={<DownloadOutlined />}
                        href={`${API_URL}/api/upload/template/${selectedType}?format=xlsx`}
                      >
                        Download Excel Template
                      </Button>
                    )}
                  </Space>
                </Card>

                {/* File Upload */}
                <Card title="Step 2: Upload File">
                  <Dragger
                    accept=".csv,.xlsx,.xls,.json"
                    maxCount={1}
                    beforeUpload={(file) => {
                      setSelectedFile(file);
                      setPreview(null);
                      setResult(null);
                      return false; // prevent auto upload
                    }}
                    onRemove={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setResult(null);
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p>Click or drag a file here (CSV, Excel, JSON)</p>
                  </Dragger>

                  {selectedFile && (
                    <Button
                      type="primary"
                      onClick={handlePreview}
                      loading={loading}
                      style={{ marginTop: 16 }}
                    >
                      Preview & Validate
                    </Button>
                  )}
                </Card>

                {/* Preview */}
                {preview && (
                  <Card title="Step 3: Data Preview">
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Text>
                        File: {preview.fileName} | Rows: {preview.totalRows} | Size:{" "}
                        {(preview.fileSize / 1024).toFixed(1)} KB
                      </Text>

                      {preview.validation && (
                        <>
                          {preview.validation.valid ? (
                            <Alert
                              type="success"
                              message={`All ${preview.validation.validRowCount} rows are valid`}
                              showIcon
                            />
                          ) : (
                            <Alert
                              type="warning"
                              message={`${preview.validation.errorCount} validation errors found. ${preview.validation.validRowCount} valid rows will be uploaded.`}
                              showIcon
                            />
                          )}

                          {preview.validation.errors.length > 0 && (
                            <Table
                              dataSource={preview.validation.errors}
                              columns={[
                                { title: "Row", dataIndex: "row", key: "row" },
                                { title: "Field", dataIndex: "field", key: "field" },
                                { title: "Error", dataIndex: "message", key: "message" },
                              ]}
                              rowKey={(r) => `${r.row}-${r.field}`}
                              size="small"
                              pagination={{ pageSize: 5 }}
                            />
                          )}
                        </>
                      )}

                      <Divider>Preview (first 10 rows)</Divider>
                      <Table
                        dataSource={preview.preview}
                        columns={preview.headers.map((h) => ({
                          title: h,
                          dataIndex: h,
                          key: h,
                          ellipsis: true,
                        }))}
                        rowKey={(_, i) => String(i)}
                        size="small"
                        scroll={{ x: true }}
                        pagination={false}
                      />

                      <Button
                        type="primary"
                        size="large"
                        onClick={handleProcess}
                        loading={loading}
                        disabled={
                          preview.validation
                            ? preview.validation.validRowCount === 0
                            : false
                        }
                      >
                        Push to ERPNext
                      </Button>
                    </Space>
                  </Card>
                )}

                {/* Result */}
                {result && (
                  <Card title="Upload Result">
                    <Progress
                      percent={Math.round(
                        ((result.succeeded + result.failed) / Math.max(result.total, 1)) * 100
                      )}
                      status={result.failed > 0 ? "exception" : "success"}
                    />
                    <Space style={{ marginTop: 16 }}>
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        {result.succeeded} succeeded
                      </Tag>
                      {result.failed > 0 && (
                        <Tag icon={<CloseCircleOutlined />} color="error">
                          {result.failed} failed
                        </Tag>
                      )}
                    </Space>

                    {result.errors.length > 0 && (
                      <Table
                        dataSource={result.errors}
                        columns={[
                          { title: "Row", dataIndex: "row", key: "row" },
                          { title: "Error", dataIndex: "message", key: "message" },
                        ]}
                        rowKey={(r) => `${r.row}-${r.message}`}
                        size="small"
                        style={{ marginTop: 16 }}
                        pagination={{ pageSize: 10 }}
                      />
                    )}
                  </Card>
                )}

                {error && (
                  <Alert type="error" message={error} showIcon closable />
                )}
              </Space>
            ),
          },
          {
            key: "logs",
            label: "Upload Logs",
            children: (
              <Card
                title="Upload History"
                extra={
                  <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
                    Refresh
                  </Button>
                }
              >
                <Table
                  dataSource={logs}
                  columns={logColumns}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
