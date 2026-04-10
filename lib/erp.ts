/**
 * ERPNext REST API Integration Library
 * ======================================
 * All interaction with ERPNext goes through this module.
 * Uses token-based authentication.  Never touches the ERP database directly.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ERPConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  timeout?: number;
}

export interface ERPListParams {
  fields?: string[];
  filters?: Array<[string, string, string | number]>;
  orderBy?: string;
  limitPageLength?: number;
  limitStart?: number;
}

export interface ERPResponse<T = any> {
  data: T;
  message?: string;
}

export interface SalesSummary {
  totalSales: number;
  todaySales: number;
  salesCount: number;
  recentOrders: any[];
}

export interface CustomerSummary {
  totalCustomers: number;
  newCustomersThisMonth: number;
  customers: any[];
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: any[];
  totalValue: number;
  items: any[];
}

export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  orders: any[];
}

export interface InvoiceSummary {
  totalInvoices: number;
  unpaidInvoices: number;
  totalOutstanding: number;
  invoices: any[];
}

// ---------------------------------------------------------------------------
// ERPNext Client Class
// ---------------------------------------------------------------------------

export class ERPNextClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(cfg: ERPConfig) {
    this.baseUrl = cfg.baseUrl.replace(/\/+$/, "");

    this.client = axios.create({
      baseURL: `${this.baseUrl}/api`,
      timeout: cfg.timeout ?? 30_000,
      headers: {
        Authorization: `token ${cfg.apiKey}:${cfg.apiSecret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Response interceptor for consistent error handling
    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error.response?.status;
        const message =
          error.response?.data?.message ??
          error.response?.data?._server_messages ??
          error.message;
        const wrapped = new Error(
          `ERPNext API error (${status ?? "NETWORK"}): ${message}`
        );
        (wrapped as any).status = status;
        (wrapped as any).original = error;
        throw wrapped;
      }
    );
  }

  // -----------------------------------------------------------------------
  // Generic helpers
  // -----------------------------------------------------------------------

  /** GET a single document */
  async getDoc(doctype: string, name: string): Promise<any> {
    const res = await this.client.get(`/resource/${doctype}/${name}`);
    return res.data.data;
  }

  /** GET a list of documents */
  async getList(doctype: string, params: ERPListParams = {}): Promise<any[]> {
    const query: Record<string, string> = {};

    if (params.fields) query.fields = JSON.stringify(params.fields);
    if (params.filters) query.filters = JSON.stringify(params.filters);
    if (params.orderBy) query.order_by = params.orderBy;
    if (params.limitPageLength !== undefined)
      query.limit_page_length = String(params.limitPageLength);
    if (params.limitStart !== undefined)
      query.limit_start = String(params.limitStart);

    const res = await this.client.get(`/resource/${doctype}`, { params: query });
    return res.data.data;
  }

  /** POST — create a new document */
  async createDoc(doctype: string, data: Record<string, any>): Promise<any> {
    const res = await this.client.post(`/resource/${doctype}`, { data });
    return res.data.data;
  }

  /** PUT — update an existing document */
  async updateDoc(
    doctype: string,
    name: string,
    data: Record<string, any>
  ): Promise<any> {
    const res = await this.client.put(`/resource/${doctype}/${name}`, { data });
    return res.data.data;
  }

  /** DELETE a document */
  async deleteDoc(doctype: string, name: string): Promise<void> {
    await this.client.delete(`/resource/${doctype}/${name}`);
  }

  /** Call a whitelisted ERPNext method */
  async callMethod(method: string, args: Record<string, any> = {}): Promise<any> {
    const res = await this.client.post(`/method/${method}`, args);
    return res.data;
  }

  /** Report builder query */
  async getReport(reportName: string, filters: Record<string, any> = {}): Promise<any> {
    const res = await this.client.get(`/method/frappe.client.get_report`, {
      params: {
        report_name: reportName,
        filters: JSON.stringify(filters),
      },
    });
    return res.data;
  }

  /** Ping — quick health-check */
  async ping(): Promise<boolean> {
    try {
      await this.client.get("/method/frappe.auth.get_logged_user");
      return true;
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // MODULE 2 — High-level business functions
  // -----------------------------------------------------------------------

  /** Today's sales + recent sales orders */
  async getSales(): Promise<SalesSummary> {
    const today = new Date().toISOString().slice(0, 10);

    const [todayOrders, allOrders] = await Promise.all([
      this.getList("Sales Order", {
        fields: ["name", "grand_total", "status", "transaction_date", "customer"],
        filters: [["transaction_date", "=", today]],
        orderBy: "creation desc",
        limitPageLength: 100,
      }),
      this.getList("Sales Order", {
        fields: ["name", "grand_total", "status", "transaction_date", "customer"],
        orderBy: "creation desc",
        limitPageLength: 20,
      }),
    ]);

    const todaySales = todayOrders.reduce(
      (sum: number, o: any) => sum + (parseFloat(o.grand_total) || 0),
      0
    );
    const totalSales = allOrders.reduce(
      (sum: number, o: any) => sum + (parseFloat(o.grand_total) || 0),
      0
    );

    return {
      totalSales,
      todaySales,
      salesCount: todayOrders.length,
      recentOrders: allOrders,
    };
  }

  /** Customer count + new-this-month list */
  async getCustomers(): Promise<CustomerSummary> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    const firstOfMonthStr = firstOfMonth.toISOString().slice(0, 10);

    const [allCustomers, newCustomers] = await Promise.all([
      this.getList("Customer", {
        fields: ["name", "customer_name", "customer_group", "territory", "creation"],
        limitPageLength: 0, // 0 = all
      }),
      this.getList("Customer", {
        fields: ["name", "customer_name", "customer_group", "territory", "creation"],
        filters: [["creation", ">=", firstOfMonthStr]],
        orderBy: "creation desc",
      }),
    ]);

    return {
      totalCustomers: allCustomers.length,
      newCustomersThisMonth: newCustomers.length,
      customers: allCustomers.slice(0, 50),
    };
  }

  /** Inventory overview + low-stock alerts */
  async getInventory(): Promise<InventorySummary> {
    const items = await this.getList("Item", {
      fields: [
        "name",
        "item_name",
        "item_group",
        "stock_uom",
        "safety_stock",
        "standard_rate",
        "disabled",
      ],
      filters: [["disabled", "=", 0]],
      limitPageLength: 0,
    });

    // Fetch warehouse stock levels via Bin
    let bins: any[] = [];
    try {
      bins = await this.getList("Bin", {
        fields: ["item_code", "warehouse", "actual_qty", "projected_qty", "reserved_qty"],
        limitPageLength: 0,
      });
    } catch {
      // Bin doctype access may be restricted — degrade gracefully
    }

    const stockMap = new Map<string, number>();
    for (const b of bins) {
      const cur = stockMap.get(b.item_code) ?? 0;
      stockMap.set(b.item_code, cur + (parseFloat(b.actual_qty) || 0));
    }

    const enriched = items.map((item: any) => ({
      ...item,
      actualQty: stockMap.get(item.name) ?? 0,
    }));

    const lowStockItems = enriched.filter(
      (i: any) =>
        i.safety_stock && i.actualQty < parseFloat(i.safety_stock)
    );

    const totalValue = enriched.reduce(
      (sum: number, i: any) =>
        sum + i.actualQty * (parseFloat(i.standard_rate) || 0),
      0
    );

    return {
      totalItems: items.length,
      lowStockItems,
      totalValue,
      items: enriched.slice(0, 100),
    };
  }

  /** Pending & recent orders */
  async getOrders(): Promise<OrderSummary> {
    const [allOrders, pendingOrders] = await Promise.all([
      this.getList("Sales Order", {
        fields: [
          "name",
          "customer",
          "grand_total",
          "status",
          "transaction_date",
          "delivery_date",
        ],
        orderBy: "creation desc",
        limitPageLength: 50,
      }),
      this.getList("Sales Order", {
        fields: [
          "name",
          "customer",
          "grand_total",
          "status",
          "transaction_date",
          "delivery_date",
        ],
        filters: [
          ["status", "in", ["Draft", "To Deliver and Bill", "To Deliver", "To Bill"]],
        ],
        orderBy: "creation desc",
        limitPageLength: 50,
      }),
    ]);

    const completedOrders = allOrders.filter(
      (o: any) => o.status === "Completed"
    );

    return {
      totalOrders: allOrders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      orders: allOrders,
    };
  }

  /** Invoices overview */
  async getInvoices(): Promise<InvoiceSummary> {
    const invoices = await this.getList("Sales Invoice", {
      fields: [
        "name",
        "customer",
        "grand_total",
        "outstanding_amount",
        "status",
        "posting_date",
        "due_date",
      ],
      orderBy: "creation desc",
      limitPageLength: 50,
    });

    const unpaid = invoices.filter(
      (inv: any) => parseFloat(inv.outstanding_amount) > 0
    );
    const totalOutstanding = unpaid.reduce(
      (sum: number, inv: any) => sum + (parseFloat(inv.outstanding_amount) || 0),
      0
    );

    return {
      totalInvoices: invoices.length,
      unpaidInvoices: unpaid.length,
      totalOutstanding,
      invoices,
    };
  }

  /** Full dashboard overview — single call for the frontend */
  async getDashboardOverview() {
    const [sales, customers, inventory, orders, invoices] = await Promise.all([
      this.getSales(),
      this.getCustomers(),
      this.getInventory(),
      this.getOrders(),
      this.getInvoices(),
    ]);

    return { sales, customers, inventory, orders, invoices };
  }
}

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

let _instance: ERPNextClient | null = null;

export function getERPClient(cfg?: ERPConfig): ERPNextClient {
  if (!_instance) {
    if (!cfg) {
      // Read from env
      cfg = {
        baseUrl: process.env.ERPNEXT_BASE_URL || "http://localhost:8000",
        apiKey: process.env.ERPNEXT_API_KEY || "",
        apiSecret: process.env.ERPNEXT_API_SECRET || "",
      };
    }
    _instance = new ERPNextClient(cfg);
  }
  return _instance;
}

export default ERPNextClient;
