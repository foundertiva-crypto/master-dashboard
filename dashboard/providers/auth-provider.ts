/**
 * Refine Auth Provider — connects to /api/auth endpoints
 */

import type { AuthProvider } from "@refinedev/core";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      if (data.data?.accessToken) {
        localStorage.setItem("access_token", data.data.accessToken);
        localStorage.setItem("refresh_token", data.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        return { success: true, redirectTo: "/dashboard" };
      }

      return { success: false, error: { name: "Login Error", message: "Invalid response" } };
    } catch (err: any) {
      return {
        success: false,
        error: {
          name: "Login Error",
          message: err.response?.data?.error || err.message,
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return { authenticated: false, redirectTo: "/login" };
    }
    return { authenticated: true };
  },

  getPermissions: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      return JSON.parse(user).role;
    }
    return null;
  },

  getIdentity: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      return {
        id: parsed.id,
        name: parsed.fullName,
        email: parsed.email,
        avatar: undefined,
      };
    }
    return null;
  },

  onError: async (error) => {
    if (error.statusCode === 401) {
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },

  register: async ({ email, password, fullName }) => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        fullName,
      });
      return { success: true, redirectTo: "/login" };
    } catch (err: any) {
      return {
        success: false,
        error: {
          name: "Register Error",
          message: err.response?.data?.error || err.message,
        },
      };
    }
  },
};

export default authProvider;
