/**
 * AWS S3 Integration Library
 * ============================
 * Handles all file operations with AWS S3.
 * Used for: uploads, logs, reports, temporary storage.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import path from "path";
import { v4 as uuid } from "uuid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

export interface UploadOptions {
  prefix?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  useOriginalName?: boolean;
}

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
  size: number;
  contentType: string;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

// ---------------------------------------------------------------------------
// S3 Storage Class
// ---------------------------------------------------------------------------

export class S3Storage {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor(cfg: S3Config) {
    this.bucket = cfg.bucket;
    this.region = cfg.region;

    this.client = new S3Client({
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }

  // -----------------------------------------------------------------------
  // Core operations
  // -----------------------------------------------------------------------

  /** Upload a file (Buffer or Readable stream) */
  async uploadFile(
    fileBuffer: Buffer | Readable,
    originalName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");

    const fileName = options.useOriginalName
      ? `${safeBase}${ext}`
      : `${safeBase}_${uuid().slice(0, 8)}${ext}`;

    const prefix = options.prefix ?? "uploads";
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
    const key = `${prefix}/${datePrefix}/${fileName}`;

    const contentType =
      options.contentType ?? this.guessContentType(originalName);

    // Determine size
    let size = 0;
    if (Buffer.isBuffer(fileBuffer)) {
      size = fileBuffer.length;
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: options.metadata,
      })
    );

    return {
      key,
      bucket: this.bucket,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      size,
      contentType,
    };
  }

  /** Get a file as a readable stream */
  async getFile(key: string): Promise<{ stream: Readable; contentType: string }> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );

    return {
      stream: res.Body as Readable,
      contentType: res.ContentType ?? "application/octet-stream",
    };
  }

  /** Get a pre-signed download URL (default 1 hour) */
  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /** Delete a file */
  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }

  /** List files in a prefix */
  async listFiles(
    prefix: string,
    maxKeys = 1000
  ): Promise<FileInfo[]> {
    const res = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      })
    );

    return (res.Contents ?? []).map((obj) => ({
      key: obj.Key!,
      size: obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
    }));
  }

  /** Check if a file exists */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return true;
    } catch {
      return false;
    }
  }

  /** Copy a file within the same bucket */
  async copyFile(sourceKey: string, destKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey,
      })
    );
  }

  /** Move a file (copy + delete source) */
  async moveFile(sourceKey: string, destKey: string): Promise<void> {
    await this.copyFile(sourceKey, destKey);
    await this.deleteFile(sourceKey);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private guessContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const map: Record<string, string> = {
      ".csv": "text/csv",
      ".json": "application/json",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".txt": "text/plain",
      ".log": "text/plain",
      ".xml": "application/xml",
      ".zip": "application/zip",
    };
    return map[ext] ?? "application/octet-stream";
  }
}

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

let _instance: S3Storage | null = null;

export function getS3Storage(cfg?: S3Config): S3Storage {
  if (!_instance) {
    if (!cfg) {
      cfg = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        region: process.env.AWS_REGION || "us-east-1",
        bucket: process.env.S3_BUCKET_NAME || "master-dashboard-storage",
      };
    }
    _instance = new S3Storage(cfg);
  }
  return _instance;
}

export default S3Storage;
