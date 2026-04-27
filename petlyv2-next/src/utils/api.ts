const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================================
// Token management
// ============================================================

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('petly_token');
}

export function setToken(token: string): void {
  localStorage.setItem('petly_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('petly_token');
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('petly_user');
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any): void {
  localStorage.setItem('petly_user', JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem('petly_user');
}

export function logout(): void {
  removeToken();
  removeUser();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ============================================================
// HTTP helper
// ============================================================

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || `Erro ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return data as T;
}

// ============================================================
// Auth API
// ============================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterTutorPayload {
  name: string;
  email: string;
  password: string;
  role: 'tutor';
}

export interface RegisterCaregiverPayload {
  name: string;
  email: string;
  password: string;
  cpf: string;
  location: string;
  role: 'caregiver';
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  message?: string;
}

export async function apiLogin(payload: LoginPayload): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(data.access_token);
  setUser(data.user);
  return data;
}

export async function apiRegister(
  payload: RegisterTutorPayload | RegisterCaregiverPayload,
): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(data.access_token);
  setUser(data.user);
  return data;
}

// ============================================================
// Users / Caregivers API
// ============================================================

export async function apiGetProfile(): Promise<any> {
  return request('/users/me');
}

export async function apiUpdateProfile(id: string, payload: any): Promise<any> {
  return request(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function apiGetCaregivers(filters?: {
  type?: string;
  location?: string;
  maxPrice?: number;
  sortBy?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters?.location) params.set('location', filters.location);
  if (filters?.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);

  const query = params.toString();
  return request(`/users/caregivers${query ? `?${query}` : ''}`);
}

export async function apiGetCaregiver(id: string): Promise<any> {
  return request(`/users/${id}`);
}

// ============================================================
// Bookings API
// ============================================================

export interface CreateBookingPayload {
  caregiverId: string;
  startDate: string;
  endDate: string;
  serviceType: string;
  petsCount: number;
  notes?: string;
}

export interface SubmitBookingReviewPayload {
  rating: number;
  comment?: string;
}

export async function apiCreateBooking(payload: CreateBookingPayload): Promise<any> {
  return request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetMyBookings(): Promise<any[]> {
  return request('/bookings/my');
}

export async function apiCancelBooking(id: string): Promise<any> {
  return request(`/bookings/${id}/cancel`, { method: 'PATCH' });
}

export async function apiCompleteBooking(id: string): Promise<any> {
  return request(`/bookings/${id}/complete`, { method: 'PATCH' });
}

export async function apiSubmitBookingReview(
  id: string,
  payload: SubmitBookingReviewPayload,
): Promise<any> {
  return request(`/bookings/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
