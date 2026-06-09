import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API 方法集合
export const apiClient = {
  // 客户相关
  getCustomers: () => api.get('/api/customers'),
  getCustomer: (id: string) => api.get(`/api/customers/${id}`),
  createCustomer: (data: any) => api.post('/api/customers', data),
  updateCustomer: (id: string, data: any) =>
    api.put(`/api/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/api/customers/${id}`),

  // 项目相关
  getProjects: () => api.get('/api/projects'),
  getProject: (id: string) => api.get(`/api/projects/${id}`),
  createProject: (data: any) => api.post('/api/projects', data),
  updateProject: (id: string, data: any) =>
    api.put(`/api/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/api/projects/${id}`),

  // 支付相关
  getPayments: (params?: any) => api.get('/api/payments', { params }),
  getPayment: (id: string) => api.get(`/api/payments/${id}`),
  createPayment: (data: any) => api.post('/api/payments', data),
  approvePayment: (id: string, notes?: string) =>
    api.post(`/api/payments/${id}/approve`, { notes }),
  rejectPayment: (id: string, reason: string) =>
    api.post(`/api/payments/${id}/reject`, { reason }),

  // 合同相关
  getContracts: () => api.get('/api/contracts'),
  getContract: (id: string) => api.get(`/api/contracts/${id}`),
  createContract: (data: any) => api.post('/api/contracts', data),
  updateContract: (id: string, data: any) =>
    api.put(`/api/contracts/${id}`, data),

  // 预算相关
  getBudgets: () => api.get('/api/budgets'),
  getLedger: (params?: any) => api.get('/api/ledger', { params }),

  // 审计日志
  getAuditLogs: (params?: any) => api.get('/api/audit-logs', { params }),
};
