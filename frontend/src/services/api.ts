const API_BASE = import.meta.env.VITE_API_URL+`api` || 'http://localhost:3000/api';

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

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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

  updateType: (id: string, data: any) =>
    request<any>(`/gold/types/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

export { ApiError };
