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

async function post(path: string, body: unknown, fallback: string): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) return;
  const detail = (await res.json().catch(() => null))?.detail;
  throw new Error(typeof detail === 'string' ? detail : fallback); // 422 detail is an array
}

export const register = (b: { name: string; business_name: string; email: string; password: string }) =>
  post('/api/v1/auth/register', b, 'Sign up failed');

export const resendVerification = (email: string) =>
  post('/api/v1/auth/resend-verification', { email }, 'Could not resend email');

// Sets the session cookie on success.
export const verifyEmail = (token: string) => post('/api/v1/auth/verify-email', { token }, 'Confirmation failed');

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

// ---- Inbox (real Instagram DMs + WhatsApp messages via the backend webhook) ----
import type { ChannelType, ChatMessage, ConversationThread } from './types';

interface ConversationDto {
  id: string;
  channel: ChannelType;
  status: string;
  mode: string;
  last_message_at: string | null;
  customer_id: string;
  customer_name: string | null;
  customer_username: string | null;
}

interface MessageDto {
  id: string;
  sender_type: 'customer' | 'ai' | 'agent' | 'system';
  message_type: string;
  content: string | null;
  media_url: string | null;
  ai_generated: boolean;
  created_at: string;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const toChatMessage = (m: MessageDto): ChatMessage => ({
  id: m.id,
  sender: m.sender_type === 'customer' ? 'customer' : m.sender_type === 'ai' ? 'ai' : 'human',
  text: m.content ?? '',
  mediaUrl: m.media_url ?? undefined,
  mediaType: m.message_type,
  timestamp: fmtTime(m.created_at),
});

const toThread = (c: ConversationDto): ConversationThread => ({
  id: c.id,
  channel: c.channel,
  customerName: c.customer_name ?? c.customer_username ?? c.customer_id,
  // WhatsApp "usernames" are the customer's +phone — no @ in front of those.
  customerHandle: c.customer_username
    ? c.channel === 'whatsapp' ? c.customer_username : `@${c.customer_username}`
    : c.customer_id,
  lastSeen: c.last_message_at ? fmtTime(c.last_message_at) : '',
  lastMessageAt: c.last_message_at ?? '',
  status: c.mode === 'ai' ? 'AUTO_PILOT' : 'NEEDS_HUMAN',
  messages: [],
});

export async function listConversations(): Promise<ConversationThread[]> {
  const res = await fetch('/api/v1/conversations');
  if (!res.ok) throw new Error('Failed to load conversations');
  return ((await res.json()) as ConversationDto[]).map(toThread);
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/v1/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error('Failed to load messages');
  return ((await res.json()) as MessageDto[]).map(toChatMessage);
}

// ---- Dashboard (GET /api/v1/dashboard) ----
export type ChannelCounts = Record<'whatsapp' | 'instagram' | 'facebook', number>;

export interface Dashboard {
  window_days: number;
  new_messages: ChannelCounts;
  top_queries: { text: string; count: number }[];
  messages_handled: ChannelCounts;
  handover: ChannelCounts;
}

export async function getDashboard(days = 1): Promise<Dashboard> {
  const res = await fetch(`/api/v1/dashboard?days=${days}`);
  if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
  return res.json();
}

// ---- Connected Instagram account(s) (GET /api/v1/social-accounts/instagram/profile) ----
export interface InstagramProfile {
  id: string; // Instagram user ID
  username: string | null;
  name: string | null;
  account_type: string | null;
  profile_picture_url: string | null;
  followers_count: number | null;
  follows_count: number | null;
  media_count: number | null;
  connected_at: string;
  live: boolean; // false: Instagram didn't answer, only the stored id/username are filled
}

export async function getInstagramProfiles(): Promise<InstagramProfile[]> {
  const res = await fetch('/api/v1/social-accounts/instagram/profile');
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
  return res.json();
}

// ---- Connected WhatsApp number(s) (GET /api/v1/social-accounts/whatsapp) ----
// Also the Channels PING: status CONNECTED, subscribed_apps non-empty, a recent last_webhook_at.
export interface WhatsAppAccount {
  phone_number_id: string;
  display_phone_number: string | null;
  verified_name: string | null;
  status: string | null; // CONNECTED = token + number can send
  quality_rating: string | null; // GREEN / YELLOW / RED
  waba_id: string | null; // known after the first webhook
  subscribed_apps: string[] | null; // null = unknown (no webhook seen yet)
  last_webhook_at: string | null;
  connected_at: string;
  live: boolean; // false: Meta didn't answer, only stored values are filled
}

export async function getWhatsAppAccounts(): Promise<WhatsAppAccount[]> {
  const res = await fetch('/api/v1/social-accounts/whatsapp');
  if (!res.ok) throw new Error(`Failed to load WhatsApp status (${res.status})`);
  return res.json();
}

// Channels → Connect: link a number (already shared with Sanchar as a partner) to this workspace.
export async function linkWhatsApp(phoneNumberId: string, wabaId: string): Promise<WhatsAppAccount> {
  const res = await fetch('/api/v1/social-accounts/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number_id: phoneNumberId, waba_id: wabaId }),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.detail;
    // 422 = pydantic validation (an array); anything else carries a readable string
    throw new Error(typeof detail === 'string' ? detail : 'Both IDs must be numbers from WhatsApp Manager.');
  }
  return res.json();
}

export async function sendReply(conversationId: string, text: string): Promise<ChatMessage> {
  const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.detail ?? 'Send failed');
  return toChatMessage(await res.json());
}

// ---- Shop context: what the auto-reply bot answers from (GET/PUT /api/v1/knowledge) ----
export interface KnowledgeSection {
  key: string;
  label: string;
  hint: string;
  content: string;
}

export interface Knowledge {
  sections: KnowledgeSection[];
  ai_enabled: boolean;
  max_chars: number;
}

async function asJson<T>(res: Response, fallback: string): Promise<T> {
  if (res.ok) return res.json();
  const detail = (await res.json().catch(() => null))?.detail;
  throw new Error(typeof detail === 'string' ? detail : fallback);
}

const sendJson = (method: string, path: string, body: unknown) =>
  fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const getKnowledge = () => fetch('/api/v1/knowledge').then((r) => asJson<Knowledge>(r, 'Could not load shop info'));

export const saveKnowledgeSection = (key: string, content: string) =>
  sendJson('PUT', `/api/v1/knowledge/${key}`, { content }).then((r) => asJson<KnowledgeSection>(r, 'Save failed'));

export const setAiEnabled = (enabled: boolean) =>
  sendJson('PATCH', '/api/v1/tenants/me', { ai_auto_reply: enabled }).then((r) => asJson<unknown>(r, 'Could not change the AI setting'));

export const testBot = (message: string) =>
  sendJson('POST', '/api/v1/knowledge/test', { message }).then((r) =>
    asJson<{ reply: string; handover: boolean; reason: string }>(r, 'Test failed')
  );
