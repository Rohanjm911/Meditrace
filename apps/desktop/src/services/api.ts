const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const API_BASE = isFileProtocol ? 'http://localhost:4000/api' : '/api';
const SIMULATOR_BASE = 'http://localhost:4001';

export class ApiError extends Error {
  code?: string;
  details?: any;
  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('meditrace_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // If unauthorized, clear token if expired
    if (!endpoint.includes('/auth/login')) {
      localStorage.removeItem('meditrace_token');
      localStorage.removeItem('meditrace_user');
      window.dispatchEvent(new Event('meditrace:auth-expired'));
    }
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', data.code, data.details);
    }
    return data;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(text || `Error HTTP ${response.status}`);
  }

  return response as unknown as T;
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),

  // Health
  getHealth: () => request<any>('/health'),

  // Products
  getProducts: () => request<{ success: boolean; products: any[] }>('/products'),
  getProduct: (id: string) => request<{ success: boolean; product: any }>(`/products/${id}`),
  createProduct: (data: any) =>
    request<{ success: boolean; product: any }>('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Batches
  getBatches: (params?: { status?: string; productId?: string; search?: string; scope?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; batches: any[] }>(`/batches${query ? `?${query}` : ''}`);
  },
  getBatch: (id: string) => request<{ success: boolean; batch: any }>(`/batches/${id}`),
  createBatch: (data: any) =>
    request<{ success: boolean; batch: any }>('/batches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateBatchStatus: (id: string, data: { status: string; reason: string }) =>
    request<{ success: boolean; batch: any }>(`/batches/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Shipments
  getShipments: (params?: { status?: string; scope?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; shipments: any[] }>(`/shipments${query ? `?${query}` : ''}`);
  },
  createShipment: (data: any) =>
    request<{ success: boolean; shipment: any }>('/shipments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  dispatchShipment: (id: string) =>
    request<{ success: boolean; shipment: any }>(`/shipments/${id}/dispatch`, {
      method: 'POST'
    }),
  acceptHandoff: (shipmentId: string, handoffId: string, data: { location: string; notes?: string }) =>
    request<{ success: boolean; message: string }>(`/shipments/${shipmentId}/handoff/${handoffId}/accept`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  rejectHandoff: (shipmentId: string, handoffId: string, data: { location: string; rejectionReason: string }) =>
    request<{ success: boolean; message: string }>(`/shipments/${shipmentId}/handoff/${handoffId}/reject`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Telemetry & Sensors
  getSensors: (params?: { scope?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; sensors: any[] }>(`/telemetry/sensors${query ? `?${query}` : ''}`);
  },
  getReadings: (params?: { sensorId?: string; batchId?: string; shipmentId?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; readings: any[] }>(`/telemetry/readings${query ? `?${query}` : ''}`);
  },

  // Alerts
  getAlerts: (params?: { status?: string; severity?: string; scope?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; alerts: any[] }>(`/alerts${query ? `?${query}` : ''}`);
  },
  acknowledgeAlert: (id: string, notes: string) =>
    request<{ success: boolean; alert: any }>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    }),
  resolveAlert: (id: string, resolutionNotes: string) =>
    request<{ success: boolean; alert: any }>(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes })
    }),

  // Verification
  verifyCode: (data: { code: string; scanType: 'QR' | 'GS1_DATAMATRIX' | 'MANUAL'; location?: string }) =>
    request<{ success: boolean; result: any }>('/verification/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getVerificationHistory: () => request<{ success: boolean; history: any[] }>('/verification/history'),

  // Blockchain
  getBlockchainStatus: () => request<any>('/blockchain/status'),
  getBlockchainTransactions: (limit = 50) => request<{ success: boolean; transactions: any[] }>(`/blockchain/transactions?limit=${limit}`),
  getBatchProvenance: (batchNumber: string) => request<any>(`/blockchain/provenance/${batchNumber}`),
  verifyHashOnChain: (hash: string) =>
    request<any>('/blockchain/verify-hash', {
      method: 'POST',
      body: JSON.stringify({ hash })
    }),

  // Users & Orgs
  getUsers: () => request<{ success: boolean; users: any[] }>('/users'),
  createUser: (data: any) =>
    request<{ success: boolean; user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateUserStatus: (id: string, isActive: boolean) =>
    request<{ success: boolean; user: any }>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    }),
  getOrganizations: () => request<{ success: boolean; organizations: any[] }>('/users/organizations'),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; resourceType?: string; limit?: number; scope?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; logs: any[] }>(`/audit-logs${query ? `?${query}` : ''}`);
  },

  // Export URLs
  getExportUrl: (type: string, format: 'pdf' | 'csv') => {
    const token = localStorage.getItem('meditrace_token');
    return `${API_BASE}/reports/export/${type}?format=${format}&token=${token}`;
  },

  // Simulator
  getSimulatorStatus: () => request<any>(`${SIMULATOR_BASE}/status`),
  configureSimulator: (data: any) =>
    request<any>(`${SIMULATOR_BASE}/config`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  startSimulator: () => request<any>(`${SIMULATOR_BASE}/start`, { method: 'POST' }),
  stopSimulator: () => request<any>(`${SIMULATOR_BASE}/stop`, { method: 'POST' }),
  emitDeterministicSimulation: (data: any) =>
    request<any>(`${SIMULATOR_BASE}/emit-deterministic`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
