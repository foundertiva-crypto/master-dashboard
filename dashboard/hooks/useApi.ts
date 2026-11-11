/**
 * Custom API hook — calls the API Gateway with auth headers
 */

import { useState, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async <T = any>(path: string): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_URL}${path}`, {
        headers: getHeaders(),
      });
      return data.data as T;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(
    async <T = any>(path: string, body: any): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.post(`${API_URL}${path}`, body, {
          headers: getHeaders(),
        });
        return data.data as T;
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const uploadFile = useCallback(
    async <T = any>(path: string, formData: FormData): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.post(`${API_URL}${path}`, formData, {
          headers: {
            ...getHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });
        return data.data as T;
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { get, post, uploadFile, loading, error };
}

export default useApi;
