/**
 * Auth Service — Frontend API layer for auth endpoints
 *
 * Connects to:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/profile
 *   PUT  /api/auth/profile
 */

const API_BASE = 'http://localhost:3000/api/auth';

// ── Types ──────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  zip_code: string | null;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// ── Token helpers ──────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function storeUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem('user');
}

// ── API calls ──────────────────────────────────────

export async function register(
  username: string,
  password: string,
  zip_code?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, zip_code }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');

  setToken(data.token);
  storeUser(data.user);
  return data;
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');

  setToken(data.token);
  storeUser(data.user);
  return data;
}

export async function getProfile(): Promise<User> {
  const token = getToken();
  if (!token) throw new Error('Not logged in');

  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');

  storeUser(data.user);
  return data.user;
}

export async function updateProfile(zip_code: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Not logged in');

  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ zip_code }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
}

export function logout() {
  clearToken();
  clearUser();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
