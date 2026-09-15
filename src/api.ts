// Thin client for the FastAPI backend, reached through the /api/v1 rewrite.
// Auth is the httpOnly session cookie; the browser attaches it automatically.

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.detail ?? 'Login failed');
}

export async function logout(): Promise<void> {
  await fetch('/api/v1/auth/logout', { method: 'POST' });
}

export interface Tenant {
  id: string;
  name: string;
  owner_name: string | null;
}

export async function getMyTenant(): Promise<Tenant> {
  const res = await fetch('/api/v1/tenants/me');
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export const INSTAGRAM_LOGIN_URL = '/api/v1/social-accounts/instagram/login';

export interface AiReply {
  answer: string;
  confidence: number;
  intent: string;
  needsHuman: boolean;
  humanReason?: string;
  entities?: Array<{ type: string; value: string }>;
  sources?: string[];
}

// ponytail: backend endpoint lands with the LLM layer (M4); until then this 404s.
export async function askAi(body: {
  query: string;
  channel?: string;
  confidenceThreshold: number;
}): Promise<AiReply> {
  const res = await fetch('/api/v1/ai/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('AI reply failed');
  return res.json();
}
