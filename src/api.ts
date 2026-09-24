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

// ---- Inbox (real Instagram DMs via the backend webhook) ----
import type { ChatMessage, ConversationThread } from './types';

interface ConversationDto {
  id: string;
  channel: 'instagram';
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
  customerHandle: c.customer_username ? `@${c.customer_username}` : c.customer_id,
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

export async function sendReply(conversationId: string, text: string): Promise<ChatMessage> {
  const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.detail ?? 'Send failed');
  return toChatMessage(await res.json());
}
