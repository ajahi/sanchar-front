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
export const FACEBOOK_LOGIN_URL = '/api/v1/social-accounts/facebook/login';

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
  needs_attention: boolean; // an open handover to a person that nobody has answered yet
  last_message_at: string | null;
  customer_id: string;
  customer_name: string | null;
  customer_username: string | null;
  lead_phone: string | null; // the number the customer gave in chat (a sales lead exists)
  campaign_name: string | null; // the campaign their ad is mapped to
  ad_title: string | null; // the ad / ref they came from, mapped or not
}

interface MessageDto {
  id: string;
  sender_type: 'customer' | 'ai' | 'agent' | 'system';
  message_type: string;
  content: string | null;
  media_url: string | null;
  ai_generated: boolean;
  created_at: string;
  sender_name: string | null;
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
  createdAt: m.created_at,
  senderName: m.sender_name ?? undefined,
});

// Meta only lets a business reply within 24h of the customer's last message (Instagram, WhatsApp, Messenger).
export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Age of the customer's last message in ms; null when there is none (or it has no real timestamp). */
export function customerMessageAgeMs(messages: ChatMessage[], now = Date.now()): number | null {
  const last = [...messages].reverse().find((m) => m.sender === 'customer' && m.createdAt);
  return last ? now - new Date(last.createdAt!).getTime() : null;
}

export function replyWindowClosed(messages: ChatMessage[], now = Date.now()): boolean {
  const age = customerMessageAgeMs(messages, now);
  return age !== null && age > REPLY_WINDOW_MS;
}

const toThread = (c: ConversationDto): ConversationThread => ({
  id: c.id,
  channel: c.channel,
  customerName: c.customer_name ?? c.customer_username ?? `Customer ${c.customer_id.slice(0, 4).toUpperCase()}`,
  // WhatsApp "usernames" are the customer's +phone — no @ in front of those.
  customerHandle: c.customer_username
    ? c.channel === 'whatsapp' ? c.customer_username : `@${c.customer_username}`
    : c.customer_id,
  lastSeen: c.last_message_at ? fmtTime(c.last_message_at) : '',
  lastMessageAt: c.last_message_at ?? '',
  status: c.needs_attention ? 'NEEDS_HUMAN' : 'AUTO_PILOT',
  leadPhone: c.lead_phone ?? undefined,
  campaignName: c.campaign_name ?? undefined,
  adTitle: c.ad_title ?? undefined,
  messages: [],
});

// "Load older chats": the backend pulls older Instagram/Messenger threads from Meta in the background
// (50 per click, continuing where the last click stopped); the inbox poll shows them as they arrive.
export async function syncHistory(): Promise<{ started: number; already_running: number }> {
  const res = await fetch('/api/v1/conversations/sync-history', { method: 'POST' });
  if (res.status === 403) throw new Error('Only owners and admins can load older chats.');
  if (!res.ok) throw new Error(`Could not start loading older chats (${res.status})`);
  return res.json();
}

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

// ---- Connected Facebook Page(s) (GET /api/v1/social-accounts/facebook) ----
// Also the Channels PING: live = token works, subscribed_fields has "messages" = Meta delivers webhooks.
export interface FacebookPage {
  page_id: string;
  name: string | null;
  subscribed_fields: string[] | null; // null = unknown (Meta didn't answer)
  last_webhook_at: string | null;
  linked_instagram_id: string | null; // the Instagram account Meta links to this Page
  instagram_verified: boolean; // ...and it is connected to this same workspace
  connected_at: string;
  live: boolean; // false: Meta didn't answer, only stored values are filled
}

export async function getFacebookPages(): Promise<FacebookPage[]> {
  const res = await fetch('/api/v1/social-accounts/facebook');
  if (!res.ok) throw new Error(`Failed to load Facebook status (${res.status})`);
  return res.json();
}

// Channels → Connect: link a Page by its id + a Page access token (never a user token).
export async function linkFacebook(pageId: string, pageAccessToken: string): Promise<FacebookPage> {
  const res = await fetch('/api/v1/social-accounts/facebook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_id: pageId, page_access_token: pageAccessToken }),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'The Page id must be a number and the token a Page access token.');
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

export const testBot = (message: string) =>
  sendJson('POST', '/api/v1/knowledge/test', { message }).then((r) =>
    asJson<{ reply: string }>(r, 'Test failed')
  );

// ---- Platform super admin (/api/v1/admin, role super_admin) ----
export const getMe = () =>
  fetch('/api/v1/auth/me').then((r) =>
    asJson<{ name: string; email: string; roles: string[]; tenant_name: string | null }>(r, 'Not authenticated')
  );

// ---- Staff of the caller's tenant (/api/v1/users, owner/admin only) ----
export interface Staff {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  verified: boolean;
}

export const listStaff = () => fetch('/api/v1/users').then((r) => asJson<Staff[]>(r, 'Could not load staff'));

export const addStaff = (b: { name: string; email: string; password: string; role: 'admin' | 'agent' }) =>
  sendJson('POST', '/api/v1/users', b).then((r) => asJson<Staff>(r, 'Could not add staff'));

export const removeStaff = (id: string) =>
  fetch(`/api/v1/users/${id}`, { method: 'DELETE' }).then(async (r) => {
    if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail ?? 'Could not remove staff');
  });

export const setStaffStatus = (id: string, status: 'active' | 'inactive') =>
  sendJson('PATCH', `/api/v1/users/${id}`, { status }).then((r) => asJson<Staff>(r, 'Could not update staff'));

export interface AdminTenant {
  id: string;
  name: string;
  owner_name: string | null;
  status: string;
  ai_auto_reply: boolean;
  has_knowledge: boolean;
  channels: string[];
  customers: number;
  conversations: number;
  open_handovers: number;
  messages: number;
  ai_replies: number;
  last_message_at: string | null;
  created_at: string;
}

export const adminListTenants = () => fetch('/api/v1/admin/tenants').then((r) => asJson<AdminTenant[]>(r, 'Could not load tenants'));

export const adminSetTenantAi = (id: string, enabled: boolean) =>
  sendJson('PATCH', `/api/v1/admin/tenants/${id}/ai`, { enabled }).then((r) => asJson<unknown>(r, 'Could not change the AI setting'));

// ---- Shop media: Instagram posts + uploaded images admins can send, with a sold-out flag (/api/v1/shop-media) ----
export interface ShopMedia {
  id: string;
  source: 'instagram' | 'upload';
  url: string;
  media_type: string; // IMAGE | CAROUSEL_ALBUM | VIDEO (a reel/video shows its thumbnail)
  title: string | null;
  caption: string | null;
  permalink: string | null;
  in_stock: boolean;
  campaign_id: string | null; // the campaign this photo is sent with
  sort_order: number;
}

// dataTransfer type used when a Shop Photos thumbnail is dragged onto the reply box.
export const MEDIA_DRAG_TYPE = 'application/x-sanchar-media';

export const listShopMedia = () => fetch('/api/v1/shop-media').then((r) => asJson<ShopMedia[]>(r, 'Could not load images'));

export const uploadShopMedia = (file: File, title: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('title', title);
  return fetch('/api/v1/shop-media', { method: 'POST', body: form }).then((r) => asJson<ShopMedia>(r, 'Upload failed'));
};

export const updateShopMedia = (
  id: string,
  patch: { title?: string; in_stock?: boolean; campaign_id?: string | null; sort_order?: number }
) =>
  sendJson('PATCH', `/api/v1/shop-media/${id}`, patch).then((r) => asJson<ShopMedia>(r, 'Update failed'));

export const deleteShopMedia = async (id: string): Promise<void> => {
  const res = await fetch(`/api/v1/shop-media/${id}`, { method: 'DELETE' });
  if (!res.ok) await asJson<unknown>(res, 'Delete failed');
};

// Sends one shop image to the customer of this conversation (Instagram only for now).
export const sendShopMedia = (conversationId: string, mediaId: string) =>
  sendJson('POST', `/api/v1/conversations/${conversationId}/media`, { media_id: mediaId }).then(async (r) =>
    toChatMessage(await asJson<MessageDto>(r, 'Could not send the image'))
  );

// ---- Campaigns: what each ad promotes (price, blurb, photos) and which ads / ref codes map to it ----
export interface Campaign {
  id: string;
  name: string;
  price: number | null; // whole rupees
  blurb: string | null;
  status: 'active' | 'paused';
  photo_count: number;
}

export interface CampaignLink {
  id: string;
  kind: 'ad' | 'ref';
  external_id: string;
  ad_title: string | null;
  ad_image_url: string | null;
  campaign_id: string | null; // null: an ad we have seen but nobody has mapped yet
  created_at: string;
}

export const listCampaigns = () => fetch('/api/v1/campaigns').then((r) => asJson<Campaign[]>(r, 'Could not load campaigns'));

export const createCampaign = (body: { name: string; price: number | null; blurb: string | null }) =>
  sendJson('POST', '/api/v1/campaigns', body).then((r) => asJson<Campaign>(r, 'Could not create the campaign'));

export const updateCampaign = (
  id: string,
  patch: { name?: string; price?: number | null; blurb?: string | null; status?: 'active' | 'paused' }
) => sendJson('PATCH', `/api/v1/campaigns/${id}`, patch).then((r) => asJson<Campaign>(r, 'Could not save the campaign'));

export const deleteCampaign = async (id: string): Promise<void> => {
  const res = await fetch(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
  if (!res.ok) await asJson<unknown>(res, 'Could not delete the campaign');
};

export const listCampaignLinks = () =>
  fetch('/api/v1/campaigns/links').then((r) => asJson<CampaignLink[]>(r, 'Could not load ads'));

export const addCampaignLink = (kind: 'ad' | 'ref', external_id: string, campaign_id: string | null) =>
  sendJson('POST', '/api/v1/campaigns/links', { kind, external_id, campaign_id }).then((r) =>
    asJson<CampaignLink>(r, 'Could not add the link')
  );

export const mapCampaignLink = (id: string, campaign_id: string | null) =>
  sendJson('PATCH', `/api/v1/campaigns/links/${id}`, { campaign_id }).then((r) =>
    asJson<CampaignLink>(r, 'Could not map the ad')
  );
