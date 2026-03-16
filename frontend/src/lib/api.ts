// In production (Vercel), requests go through the Next.js proxy rewrite (/api/* → BACKEND_URL/*).
// Override with NEXT_PUBLIC_API_URL if you want to call the backend directly.
const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:4000');

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the API server. Please ensure the backend is running.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`API server returned an unexpected response (HTTP ${res.status}). Check that NEXT_PUBLIC_API_URL is set correctly.`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: any) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  users: () => request('/auth/users'),

  // Problems
  getProblems: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/problems${q ? '?' + q : ''}`);
  },
  getProblem: (id: string) => request(`/problems/${id}`),
  createProblem: (data: any) =>
    request('/problems', { method: 'POST', body: JSON.stringify(data) }),
  updateProblem: (id: string, data: any) =>
    request(`/problems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProblem: (id: string) =>
    request(`/problems/${id}`, { method: 'DELETE' }),

  // Actions
  getActions: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/actions${q ? '?' + q : ''}`);
  },
  createAction: (data: any) =>
    request('/actions', { method: 'POST', body: JSON.stringify(data) }),
  updateAction: (id: string, data: any) =>
    request(`/actions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAction: (id: string) =>
    request(`/actions/${id}`, { method: 'DELETE' }),

  // Machines & Facilities
  getFacilities: () => request('/facilities'),
  createFacility: (data: any) =>
    request('/facilities', { method: 'POST', body: JSON.stringify(data) }),
  getMachines: (facilityId?: string) =>
    request(`/machines${facilityId ? '?facilityId=' + facilityId : ''}`),
  createMachine: (data: any) =>
    request('/machines', { method: 'POST', body: JSON.stringify(data) }),
  deleteMachine: (id: string) =>
    request(`/machines/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalyticsSummary: () => request('/analytics/summary'),
  getRootCauseDistribution: () => request('/analytics/root-cause-distribution'),
  getMachineIssues: () => request('/analytics/machine-issues'),
  getTrend: (period = 'month') => request(`/analytics/trend?period=${period}`),

  // Attachments
  uploadAttachments: async (problemId: string, files: File[]) => {
    const token = getToken();
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await fetch(`${API_URL}/attachments/${problemId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  deleteAttachment: (id: string) =>
    request(`/attachments/${id}`, { method: 'DELETE' }),
};

export type { };
