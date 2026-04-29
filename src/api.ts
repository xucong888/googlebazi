export interface ApiUser {
  uid: number;
  email: string;
  name: string;
  points: number;
}

export interface PointsHistoryItem {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  source: string;
  balance: number;
  createdAt: number;
}

export interface HistoryRecord {
  id: string;
  name: string;
  birthInfo: any;
  fateData: any;
  aiReport?: string | null;
  createdAt: number;
}

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.error || '请求失败');
    err.code = `api/${res.status}`;
    err.status = res.status;
    throw err;
  }
  return data;
}

function storeAuth(token: string, user: ApiUser) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function getCurrentUser(): ApiUser | null {
  try {
    const s = localStorage.getItem('auth_user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function loginWithEmail(email: string, password: string): Promise<ApiUser> {
  const { token, user } = await apiFetch<{ token: string; user: ApiUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  storeAuth(token, user);
  return user;
}

export async function registerWithEmail(email: string, password: string, name: string): Promise<ApiUser> {
  const { token, user } = await apiFetch<{ token: string; user: ApiUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  storeAuth(token, user);
  return user;
}

export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export async function verifyToken(): Promise<ApiUser | null> {
  if (!getToken()) return null;
  try {
    const user = await apiFetch<ApiUser>('/api/auth/me');
    localStorage.setItem('auth_user', JSON.stringify(user));
    return user;
  } catch {
    logout();
    return null;
  }
}

// Points
export async function apiGetPoints(): Promise<number> {
  const { points } = await apiFetch<{ points: number }>('/api/points');
  return points;
}

export async function apiUsePoints(amount: number, description: string): Promise<{ success: boolean; message: string; balance?: number }> {
  return apiFetch('/api/points/use', { method: 'POST', body: JSON.stringify({ amount, description }) });
}

export async function apiAddPoints(amount: number, description: string, source: string): Promise<{ success: boolean; balance?: number }> {
  return apiFetch('/api/points/add', { method: 'POST', body: JSON.stringify({ amount, description, source }) });
}

export async function apiDailyCheckIn(): Promise<{ success: boolean; message: string; balance?: number }> {
  return apiFetch('/api/points/checkin', { method: 'POST' });
}

export async function apiGetPointsHistory(): Promise<PointsHistoryItem[]> {
  return apiFetch('/api/points/history');
}

// Fate history
export async function apiSaveHistory(record: { name: string; birthInfo: any; fateData: any; aiReport?: string | null }): Promise<{ id: string }> {
  return apiFetch('/api/history', { method: 'POST', body: JSON.stringify(record) });
}

export async function apiGetHistory(): Promise<HistoryRecord[]> {
  return apiFetch('/api/history');
}

export async function apiDeleteHistory(id: string): Promise<void> {
  return apiFetch(`/api/history/${id}`, { method: 'DELETE' });
}

export async function apiUpdateHistory(id: string, aiReport: string | null): Promise<void> {
  return apiFetch(`/api/history/${id}`, { method: 'PATCH', body: JSON.stringify({ aiReport }) });
}
