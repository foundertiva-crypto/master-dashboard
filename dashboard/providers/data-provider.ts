/**
 * Refine Data Provider — wraps the API Gateway
 */

import type { DataProvider } from "@refinedev/core";
import axios, { AxiosInstance } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getAxios(): AxiosInstance {
  const instance = axios.create({ baseURL: API_URL });

  instance.interceptors.request.use((config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const http = getAxios();
    const params: Record<string, any> = {};

    if (pagination) {
      params.limit = pagination.pageSize ?? 10;
      params.offset = ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10);
    }

    const { data } = await http.get(`/api/${resource}`, { params });
    return {
      data: data.data ?? [],
      total: data.total ?? data.data?.length ?? 0,
    };
  },

  getOne: async ({ resource, id }) => {
    const http = getAxios();
    const { data } = await http.get(`/api/${resource}/${id}`);
    return { data: data.data };
  },

  create: async ({ resource, variables }) => {
    const http = getAxios();
    const { data } = await http.post(`/api/${resource}`, variables);
    return { data: data.data };
  },

  update: async ({ resource, id, variables }) => {
    const http = getAxios();
    const { data } = await http.put(`/api/${resource}/${id}`, variables);
    return { data: data.data };
  },

  deleteOne: async ({ resource, id }) => {
    const http = getAxios();
    const { data } = await http.delete(`/api/${resource}/${id}`);
    return { data: data.data };
  },

  getApiUrl: () => API_URL,
};

export default dataProvider;
