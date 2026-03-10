const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

const AUTH_TOKEN_KEY = 'jewellery-auth-token';

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiError extends Error {
  statusCode: number;
  constructor(
    statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  // Add auth token if available
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, json.message || 'Something went wrong');
  }

  return json;
}

// ==========================================
// Categories API
// ==========================================

export const categoriesApi = {
  getAll: () =>
    request<any[]>('/categories'),

  getById: (id: string) =>
    request<any>(`/categories/${encodeURIComponent(id)}`),

  create: (data: any) =>
    request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// Products API
// ==========================================

export interface ProductsQuery {
  search?: string;
  categoryId?: string;
  metalType?: string;
  karat?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const productsApi = {
  getAll: (query?: ProductsQuery) => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.set(key, String(val));
      });
    }
    const qs = params.toString();
    return request<any[]>(`/products${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    request<any>(`/products/${encodeURIComponent(id)}`),

  create: (data: any) =>
    request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  updateStock: (id: string, quantity: number) =>
    request<any>(`/products/${encodeURIComponent(id)}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  getCounts: () =>
    request<{ byCategory: Record<string, number>; byKarat: Record<string, number> }>('/products/counts'),
};

// ==========================================
// Gold API
// ==========================================

export const goldApi = {
  getRates: () =>
    request<any[]>('/gold/rates'),

  updateRate: (id: string, data: any) =>
    request<any>(`/gold/rates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getTypes: () =>
    request<any[]>('/gold/types'),

  createType: (data: any) =>
    request<any>('/gold/types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateType: (id: string, data: any) =>
    request<any>(`/gold/types/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteType: (id: string) =>
    request<any>(`/gold/types/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// Company API
// ==========================================

export const companyApi = {
  get: () =>
    request<any>('/company'),

  update: (data: any) =>
    request<any>('/company', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ==========================================
// Customers API
// ==========================================

export interface CustomersQuery {
  search?: string;
  customerType?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const customersApi = {
  getAll: (query?: CustomersQuery) => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.set(key, String(val));
      });
    }
    const qs = params.toString();
    return request<any[]>(`/customers${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    request<any>(`/customers/${encodeURIComponent(id)}`),

  create: (data: any) =>
    request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// Counters API (Auto-increment sequences per shop)
// ==========================================

export const countersApi = {
  getAll: (shopCode?: string) => {
    const qs = shopCode ? `?shopCode=${encodeURIComponent(shopCode)}` : '';
    return request<any[]>(`/counters${qs}`);
  },

  getNext: (entityType: string, shopCode: string) =>
    request<{ entityType: string; shopCode: string; prefix: string; number: number; formatted: string; formattedId: string }>(
      '/counters/next',
      { method: 'POST', body: JSON.stringify({ entityType, shopCode }) },
    ),

  initShop: (shopCode: string) =>
    request<any[]>('/counters/init-shop', {
      method: 'POST',
      body: JSON.stringify({ shopCode }),
    }),

  updatePrefix: (entityType: string, data: { shopCode: string; prefix?: string; paddingLength?: number; lastNumber?: number }) =>
    request<any>(`/counters/${encodeURIComponent(entityType)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ==========================================
// Invoices API
// ==========================================

export interface InvoicesQuery {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const invoicesApi = {
  getAll: (query?: InvoicesQuery) => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.set(key, String(val));
      });
    }
    const qs = params.toString();
    return request<any[]>(`/invoices${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    request<any>(`/invoices/${encodeURIComponent(id)}`),

  create: (data: any) =>
    request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/invoices/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  recordPayment: (id: string, data: any) =>
    request<any>(`/invoices/${encodeURIComponent(id)}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/invoices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// Clearance API
// ==========================================

export interface ClearanceQuery {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const clearanceApi = {
  getAll: (query?: ClearanceQuery) => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.set(key, String(val));
      });
    }
    const qs = params.toString();
    return request<any[]>(`/clearance${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    request<any>(`/clearance/${encodeURIComponent(id)}`),

  create: (data: any) =>
    request<any>('/clearance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/clearance/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  recordPayment: (id: string, data: any) =>
    request<any>(`/clearance/${encodeURIComponent(id)}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/clearance/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// Auth API
// ==========================================

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  shopCode: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () =>
    request<AuthUser>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ==========================================
// Users API (Admin)
// ==========================================

export const usersApi = {
  getAll: () =>
    request<AuthUser[]>('/users'),

  getById: (id: string) =>
    request<AuthUser>(`/users/${encodeURIComponent(id)}`),

  create: (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
    shopCode?: string;
  }) =>
    request<AuthUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    email?: string;
    fullName?: string;
    phone?: string;
    role?: string;
    shopCode?: string;
    isActive?: boolean;
    password?: string;
  }) =>
    request<AuthUser>(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

export { ApiError };
