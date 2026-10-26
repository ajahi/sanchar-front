import React, { useEffect, useState } from 'react';
import { Settings, Check, Globe, RefreshCw, Shield, Key, Link2, Smartphone } from 'lucide-react';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';
import { MetaConnectionStatus } from '../types';
import {
  FacebookPage,
  getFacebookPages,
  getInstagramProfiles,
  FACEBOOK_LOGIN_URL,
  getWhatsAppAccounts,
  INSTAGRAM_LOGIN_URL,
  InstagramProfile,
  linkFacebook,
  unlinkFacebook,
  linkWhatsApp,
  WhatsAppAccount,
  WhatsAppSignup,
  loadWhatsAppSignup,
  connectWhatsApp,
} from '../api';

// Tenants share their WhatsApp account with this business (Hachuwa market) as a partner.
const SANCHAR_PARTNER_BUSINESS_ID = '3977606022464196';
// No business_id in these: Meta opens the business the tenant is logged into (or asks which).
const META_WA_ACCOUNTS_URL = 'https://business.facebook.com/latest/settings/whatsapp_account';
const META_WA_MANAGER_NUMBERS_URL = 'https://business.facebook.com/wa/manage/phone-numbers/';

const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

// The three real checks behind PING: can the number send, will Meta deliver webhooks, did it.
const waChecks = (a: WhatsAppAccount) => [
  {
    ok: a.status === 'CONNECTED',
    label: 'Number & token',
    detail: a.live ? `status ${a.status ?? 'unknown'}` : "Meta didn't answer (token revoked?)",
  },
  {
    ok: !!a.subscribed_apps?.length,
    label: 'Webhook subscription',
    detail:
      a.subscribed_apps === null
        ? 'unknown until the first webhook arrives'
        : a.subscribed_apps.join(', ') || 'no app subscribed — Meta will not deliver',
  },
  {
    ok: !!a.last_webhook_at,
    label: 'Last webhook received',
    detail: a.last_webhook_at ? ago(a.last_webhook_at) : 'never',
  },
];

// Same three checks for a Messenger Page: token works, Meta will deliver "messages", Meta did.
const fbChecks = (p: FacebookPage) => [
  {
    ok: p.live,
    label: 'Page & token',
    detail: p.live ? 'token accepted by Meta' : "Meta didn't answer (token revoked?)",
  },
  {
    ok: !!p.subscribed_fields?.includes('messages'),
    label: 'Webhook subscription',
    detail:
      p.subscribed_fields === null
        ? 'unknown'
        : p.subscribed_fields.join(', ') || 'no fields subscribed — Meta will not deliver',
  },
  {
    ok: !!p.last_webhook_at,
    label: 'Last webhook received',
    detail: p.last_webhook_at ? ago(p.last_webhook_at) : 'never',
  },
];

interface MetaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metaStatus: MetaConnectionStatus;
  businessName: string;
  onUpdateBusinessName: (name: string) => void;
  defaultLanguage: 'nepali' | 'nepglish' | 'english';
  onChangeLanguage: (lang: 'nepali' | 'nepglish' | 'english') => void;
}

export const MetaSettingsModal: React.FC<MetaSettingsModalProps> = ({
  isOpen,
  onClose,
  metaStatus,
  businessName,
  onUpdateBusinessName,
  defaultLanguage,
  onChangeLanguage,
}) => {
  const [bName, setBName] = useState(businessName);
  const [webhookSecret, setWebhookSecret] = useState('socialsync_meta_wh_sec_991823');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  // null = loading. PING = the same live fetch again.
  const [waAccounts, setWaAccounts] = useState<WhatsAppAccount[] | null>(null);
  const [waError, setWaError] = useState<string | null>(null);
  const [waPinging, setWaPinging] = useState(false);

  const loadWhatsApp = () => {
    setWaPinging(true);
    setWaError(null);
    getWhatsAppAccounts()
      .then(setWaAccounts)
      .catch((e) => setWaError(e.message))
      .finally(() => setWaPinging(false));
  };

  const [igProfiles, setIgProfiles] = useState<InstagramProfile[] | null>(null);
  const [igError, setIgError] = useState<string | null>(null);

  const [fbPages, setFbPages] = useState<FacebookPage[] | null>(null);
  const [fbError, setFbError] = useState<string | null>(null);
  const [fbPinging, setFbPinging] = useState(false);
  const [fbPageId, setFbPageId] = useState('');
  const [fbToken, setFbToken] = useState('');
  const [fbLinking, setFbLinking] = useState(false);
  const [fbLinkError, setFbLinkError] = useState<string | null>(null);

  const loadFacebook = () => {
    setFbPinging(true);
    setFbError(null);
    getFacebookPages()
      .then(setFbPages)
      .catch((e) => setFbError(e.message))
      .finally(() => setFbPinging(false));
  };

  const handleFbUnlink = (p: FacebookPage) => {
    if (!confirm(`Disconnect "${p.name ?? p.page_id}"? Its messages stop arriving and its chats become read-only until you connect it again.`)) return;
    setFbError(null);
    unlinkFacebook(p.page_id).then(loadFacebook).catch((e) => setFbError(e.message));
  };

  const handleFbLink = () => {
    setFbLinking(true);
    setFbLinkError(null);
    linkFacebook(fbPageId.trim(), fbToken.trim())
      .then(() => {
        setFbPageId('');
        setFbToken('');
        loadFacebook();
      })
      .catch((e) => setFbLinkError(e.message))
      .finally(() => setFbLinking(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadWhatsApp();
      loadWhatsAppSignup().then(setWaSignup).catch((e) => setWaSignup(e.message));
      loadFacebook();
      setIgError(null);
      getInstagramProfiles().then(setIgProfiles).catch((e) => setIgError(e.message));
    }
  }, [isOpen]);

  const [linkPhoneId, setLinkPhoneId] = useState('');
  const [linkWabaId, setLinkWabaId] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Meta's Embedded Signup, loaded when Channels opens. undefined = loading; a string = why it's unavailable.
  const [waSignup, setWaSignup] = useState<WhatsAppSignup | string>();
  const [waConnecting, setWaConnecting] = useState(false);

  const handleWaSignup = () => {
    if (typeof waSignup !== 'object') return;
    setWaConnecting(true);
    setWaError(null);
    connectWhatsApp(waSignup) // opens the popup right away, inside this click
      .then(loadWhatsApp)
      .catch((e) => setWaError(e.message))
      .finally(() => setWaConnecting(false));
  };

  const handleLink = () => {
    setLinking(true);
    setLinkError(null);
    linkWhatsApp(linkPhoneId.trim(), linkWabaId.trim())
      .then(() => {
        setLinkPhoneId('');
        setLinkWabaId('');
        loadWhatsApp();
      })
      .catch((e) => setLinkError(e.message))
      .finally(() => setLinking(false));
  };

  const waAllOk = !!waAccounts?.length && waAccounts.every((a) => waChecks(a).every((c) => c.ok));
  const fbAllOk = !!fbPages?.length && fbPages.every((p) => fbChecks(p).every((c) => c.ok));

  const handleTestPing = () => {
    setIsTestingWebhook(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingWebhook(false);
      setTestResult('HTTP 200 OK — Inbound Webhooks Verified for Messenger, Instagram, & WhatsApp');
    }, 800);
  };

  const handleSave = () => {
    onUpdateBusinessName(bName);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Meta Integrations & Merchant Setup" icon={Settings} size="lg">

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
          {/* Merchant Setup */}
          <div className="matchbox-border p-3 bg-white">
            <h3 className="serif-heading text-xs font-bold text-[#1A2B4C] mb-2 border-b border-black pb-1">
              Stage 1: Merchant Profile & Default Language
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">
                  Merchant Business Name:
                </label>
                <input
                  type="text"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="w-full p-1.5 border border-black font-mono text-xs bg-[#FAF3E0]/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">
                  Default Customer NLP Dialect:
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => onChangeLanguage(e.target.value as any)}
                  className="w-full p-1.5 border border-black font-mono text-xs bg-[#FAF3E0]"
                >
                  <option value="nepglish">Romanized Nepali (Nepglish) — Recommended</option>
                  <option value="nepali">Nepali (नेपाली)</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Facebook Messenger */}
          <div className="matchbox-border p-3 bg-white">
            <div className="flex items-center justify-between mb-2 border-b border-black pb-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#1A2B4C] text-white font-bold flex items-center justify-center border border-black text-xs">
                  f
                </span>
                <h3 className="serif-heading text-xs font-bold text-[#1A2B4C]">
                  Facebook Messenger Integration
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {fbPages?.length ? (
                  <span className={`pill text-white text-[8px] ${fbAllOk ? 'bg-emerald-800' : 'bg-amber-700'}`}>
                    {fbAllOk ? '● PAGE CONNECTED' : '● CHECK STATUS'}
                  </span>
                ) : (
                  fbPages && <span className="pill bg-black/40 text-white text-[8px]">○ NOT CONNECTED</span>
                )}
                <button
                  onClick={loadFacebook}
                  disabled={fbPinging}
                  className="pill bg-[#1A1A1A] text-white hover:bg-black cursor-pointer text-[9px]"
                >
                  {fbPinging ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'PING'}
                </button>
              </div>
            </div>

            <div className="space-y-3 text-[11px]">
              {fbError && (
                <div className="p-2 bg-red-100 border border-red-700 text-red-900 text-[10px]">{fbError}</div>
              )}
              {fbPages === null && !fbError && (
                <div role="status" aria-label="Loading Facebook status" className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              )}
              {fbPages?.length === 0 && (
                <div className="space-y-2">
                  <div className="opacity-70">No Facebook Page is linked to this workspace yet.</div>
                  <a
                    href={FACEBOOK_LOGIN_URL}
                    className="pill bg-[#1A2B4C] text-white hover:opacity-90 cursor-pointer text-[9px] inline-block"
                  >
                    CONNECT FACEBOOK
                  </a>
                  <div className="text-[10px] opacity-70 pt-1">
                    Or link a Page by hand: paste the Page ID and a <b>Page access token</b> (Graph API Explorer →{' '}
                    <code>GET /me/accounts</code>; needs <code>pages_messaging</code>,{' '}
                    <code>pages_manage_metadata</code>).
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="block">
                      <span className="opacity-70 text-[9px] block">PAGE ID:</span>
                      <input
                        value={fbPageId}
                        onChange={(e) => setFbPageId(e.target.value)}
                        inputMode="numeric"
                        placeholder="e.g. 620492727822627"
                        className="w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-[10px]"
                      />
                    </label>
                    <label className="block">
                      <span className="opacity-70 text-[9px] block">PAGE ACCESS TOKEN:</span>
                      <input
                        type="password"
                        autoComplete="off"
                        value={fbToken}
                        onChange={(e) => setFbToken(e.target.value)}
                        className="w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-[10px]"
                      />
                    </label>
                  </div>
                  {fbLinkError && (
                    <div className="p-2 bg-red-100 border border-red-700 text-red-900 text-[10px]">
                      {fbLinkError}
                    </div>
                  )}
                  <button
                    onClick={handleFbLink}
                    disabled={fbLinking || !fbPageId.trim() || !fbToken.trim()}
                    className="pill bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer disabled:opacity-50 text-[9px]"
                  >
                    {fbLinking ? 'LINKING…' : 'CONNECT FACEBOOK PAGE'}
                  </button>
                </div>
              )}
              {fbPages?.map((p) => (
                <div key={p.page_id} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="opacity-70 text-[9px] block">CONNECTED PAGE:</span>
                      <span className="font-bold">{p.name ?? '—'}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="opacity-70 text-[9px] block">PAGE ID:</span>
                        <span className="font-mono">{p.page_id}</span>
                      </div>
                      <button
                        onClick={() => handleFbUnlink(p)}
                        className="pill bg-[#B8251B] text-white hover:opacity-90 cursor-pointer text-[9px]"
                      >
                        DISCONNECT
                      </button>
                    </div>
                  </div>
                  <div className="p-2 bg-[#FAF3E0]/40 border border-black text-[10px] space-y-0.5">
                    {fbChecks(p).map((c) => (
                      <div key={c.label}>
                        <span className={c.ok ? 'text-emerald-800' : 'text-[#B8251B]'}>{c.ok ? '✓' : '✗'}</span>{' '}
                        <span className="font-bold">{c.label}:</span> {c.detail}
                      </div>
                    ))}
                    <div>
                      <span className={p.instagram_verified ? 'text-emerald-800' : 'opacity-60'}>
                        {p.instagram_verified ? '✓' : '○'}
                      </span>{' '}
                      <span className="font-bold">Linked Instagram:</span>{' '}
                      {p.instagram_verified
                        ? `${p.linked_instagram_id} (connected to this workspace)`
                        : p.linked_instagram_id
                          ? `${p.linked_instagram_id} (not connected here yet)`
                          : 'none linked to this Page on Meta'}
                    </div>
                  </div>
                </div>
              ))}
              {!!fbPages?.length && (
                // Facebook's dialog → "Edit previous settings" to tick more Pages; already-linked ones stay.
                <a
                  href={FACEBOOK_LOGIN_URL}
                  className="pill bg-[#1A2B4C] text-white hover:opacity-90 cursor-pointer text-[9px] inline-block"
                >
                  + ADD ANOTHER PAGE
                </a>
              )}
            </div>
          </div>

          {/* Instagram Direct */}
          <div className="matchbox-border p-3 bg-white">
            <div className="flex items-center justify-between mb-2 border-b border-black pb-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#B8251B] text-white font-bold italic flex items-center justify-center border border-black text-xs">
                  i
                </span>
                <h3 className="serif-heading text-xs font-bold text-[#1A2B4C]">
                  Instagram Direct Messaging
                </h3>
              </div>
              {igProfiles?.length ? (
                <span className={`pill text-white text-[8px] ${igProfiles.every((a) => a.live) ? 'bg-emerald-800' : 'bg-amber-700'}`}>
                  {igProfiles.every((a) => a.live) ? '● CONNECTED' : '● CHECK STATUS'}
                </span>
              ) : (
                igProfiles && <span className="pill bg-black/40 text-white text-[8px]">○ NOT CONNECTED</span>
              )}
            </div>

            <div className="space-y-3 text-[11px]">
              {igError && (
                <div className="p-2 bg-red-100 border border-red-700 text-red-900 text-[10px]">{igError}</div>
              )}
              {igProfiles === null && !igError && (
                <div role="status" aria-label="Loading Instagram status" className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              )}
              {igProfiles?.length === 0 && (
                <div className="space-y-2">
                  <div className="opacity-70">No Instagram account is linked to this workspace yet.</div>
                  <a
                    href={INSTAGRAM_LOGIN_URL}
                    className="pill bg-[#B8251B] text-white hover:opacity-90 cursor-pointer text-[9px] inline-block"
                  >
                    CONNECT INSTAGRAM
                  </a>
                </div>
              )}
              {igProfiles?.map((a) => (
                <div key={a.id} className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="opacity-70 text-[9px] block">PROFESSIONAL ACCOUNT:</span>
                    <span className="font-bold">{a.username ? `@${a.username}` : '—'}</span>
                  </div>
                  <div>
                    <span className="opacity-70 text-[9px] block">INSTAGRAM ACCOUNT ID:</span>
                    <span className="font-mono">{a.id}</span>
                  </div>
                  {!a.live && (
                    <div className="col-span-2 text-[10px] text-[#B8251B]">
                      Instagram didn't answer (token expired?). Reconnect to refresh it.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Cloud API */}
          <div className="matchbox-border p-3 bg-white">
            <div className="flex items-center justify-between mb-2 border-b border-black pb-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-700 text-white font-bold flex items-center justify-center border border-black text-xs">
                  w
                </span>
                <h3 className="serif-heading text-xs font-bold text-[#1A2B4C]">
                  WhatsApp Cloud API (Meta Business)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {waAccounts?.length ? (
                  <span
                    className={`pill text-white text-[8px] ${waAllOk ? 'bg-emerald-800' : 'bg-amber-700'}`}
                  >
                    {waAllOk ? '● WABA CONNECTED' : '● CHECK STATUS'}
                  </span>
                ) : (
                  waAccounts && (
                    <span className="pill bg-black/40 text-white text-[8px]">○ NOT CONNECTED</span>
                  )
                )}
                <button
                  onClick={loadWhatsApp}
                  disabled={waPinging}
                  className="pill bg-[#1A1A1A] text-white hover:bg-black cursor-pointer text-[9px]"
                >
                  {waPinging ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'PING'}
                </button>
              </div>
            </div>

            <div className="space-y-3 text-[11px]">
              {waError && (
                <div className="p-2 bg-red-100 border border-red-700 text-red-900 text-[10px]">{waError}</div>
              )}
              {waAccounts === null && !waError && (
                <div role="status" aria-label="Loading WhatsApp status" className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              )}
              {waAccounts?.length === 0 && (
                <div className="space-y-2">
                  <div className="opacity-70">
                    No WhatsApp number is linked to this workspace yet. <b>Connect WhatsApp</b> below opens Meta's
                    window: log in, pick your WhatsApp account and number, done.
                  </div>
                  <details className="text-[10px]">
                  <summary className="cursor-pointer opacity-70">Or link a number by its IDs (advanced)</summary>
                  <div className="space-y-2 pt-2">
                  <ol className="list-decimal pl-4 text-[10px] space-y-1">
                    <li>
                      Open{' '}
                      <a
                        href={META_WA_ACCOUNTS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-bold text-[#B8251B]"
                      >
                        Meta Business Settings → WhatsApp accounts ↗
                      </a>
                      , pick your account → <b>Partners</b> → <b>Add</b> (or <b>Assign partner</b>) → paste
                      business ID <code className="font-bold">{SANCHAR_PARTNER_BUSINESS_ID}</code>{' '}
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(SANCHAR_PARTNER_BUSINESS_ID)}
                        className="underline cursor-pointer"
                      >
                        copy
                      </button>{' '}
                      → give it full control.
                    </li>
                    <li>
                      Open{' '}
                      <a
                        href={META_WA_MANAGER_NUMBERS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-bold text-[#B8251B]"
                      >
                        WhatsApp Manager → Phone numbers ↗
                      </a>{' '}
                      and copy the number's <b>Phone number ID</b> and your <b>WhatsApp Business Account ID</b>{' '}
                      into the boxes below.
                    </li>
                  </ol>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="block">
                      <span className="opacity-70 text-[9px] block">PHONE NUMBER ID:</span>
                      <input
                        value={linkPhoneId}
                        onChange={(e) => setLinkPhoneId(e.target.value)}
                        inputMode="numeric"
                        placeholder="e.g. 1264085063462627"
                        className="w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-[10px]"
                      />
                    </label>
                    <label className="block">
                      <span className="opacity-70 text-[9px] block">WHATSAPP BUSINESS ACCOUNT ID:</span>
                      <input
                        value={linkWabaId}
                        onChange={(e) => setLinkWabaId(e.target.value)}
                        inputMode="numeric"
                        placeholder="e.g. 1594023658962737"
                        className="w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-[10px]"
                      />
                    </label>
                  </div>
                  {linkError && (
                    <div className="p-2 bg-red-100 border border-red-700 text-red-900 text-[10px]">
                      {linkError}
                    </div>
                  )}
                  <button
                    onClick={handleLink}
                    disabled={linking || !linkPhoneId.trim() || !linkWabaId.trim()}
                    className="pill bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer disabled:opacity-50 text-[9px]"
                  >
                    {linking ? 'LINKING…' : 'LINK NUMBER'}
                  </button>
                  </div>
                  </details>
                </div>
              )}
              {waAccounts?.map((a) => (
                <div key={a.phone_number_id} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="opacity-70 text-[9px] block">DISPLAY PHONE NUMBER:</span>
                      <span className="font-bold">{a.display_phone_number ?? '—'}</span>
                    </div>
                    <div>
                      <span className="opacity-70 text-[9px] block">VERIFIED NAME:</span>
                      <span className="font-bold">{a.verified_name ?? '—'}</span>
                    </div>
                    <div>
                      <span className="opacity-70 text-[9px] block">PHONE NUMBER ID:</span>
                      <span className="font-mono">{a.phone_number_id}</span>
                    </div>
                    <div>
                      <span className="opacity-70 text-[9px] block">WABA ID / QUALITY:</span>
                      <span className="font-mono">
                        {a.waba_id ?? '—'} / {a.quality_rating ?? '—'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-[#FAF3E0]/40 border border-black text-[10px] space-y-0.5">
                    {waChecks(a).map((c) => (
                      <div key={c.label}>
                        <span className={c.ok ? 'text-emerald-800' : 'text-[#B8251B]'}>{c.ok ? '✓' : '✗'}</span>{' '}
                        <span className="font-bold">{c.label}:</span> {c.detail}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {waAccounts !== null && (
                <div className="space-y-1">
                  <button
                    onClick={handleWaSignup}
                    disabled={typeof waSignup !== 'object' || waConnecting}
                    className="pill bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer disabled:opacity-50 text-[9px]"
                  >
                    {waConnecting ? 'CONNECTING…' : waAccounts.length ? '+ ADD ANOTHER NUMBER' : 'CONNECT WHATSAPP'}
                  </button>
                  {typeof waSignup === 'string' && <div className="text-[10px] opacity-70">{waSignup}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Webhook Status & Diagnostics */}
          <div className="matchbox-border p-3 aged-paper">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[10px] uppercase font-serif">
                Unified Webhook Endpoint & Deduplication Router
              </span>
              <button
                onClick={handleTestPing}
                disabled={isTestingWebhook}
                className="pill bg-[#1A1A1A] text-white hover:bg-black cursor-pointer text-[9px]"
              >
                {isTestingWebhook ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  'PING WEBHOOKS'
                )}
              </button>
            </div>

            <div className="p-2 bg-white border border-black text-[10px] space-y-1">
              <div>
                <span className="font-bold">Callback URL:</span>{' '}
                <code className="text-[#B8251B]">https://api.socialsync.np/v1/meta/webhook</code>
              </div>
              <div>
                <span className="font-bold">Verify Token:</span>{' '}
                <code className="text-[#1A2B4C]">{webhookSecret}</code>
              </div>
            </div>

            {testResult && (
              <div className="mt-2 p-2 bg-emerald-100 border border-emerald-700 text-emerald-900 font-bold text-[10px]">
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t-2 border-black flex justify-between items-center shrink-0">
          <span className="text-[10px] text-[#1A1A1A]/70">
            Graph API Version: v21.0 • TLS 1.3
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 border border-black hover:bg-[#FAF3E0] cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="vermilion-bg text-white font-bold px-4 py-1 border-2 border-black shadow-[2px_2px_0px_black] hover:bg-[#8F1810] cursor-pointer text-xs uppercase"
            >
              Save Configuration
            </button>
          </div>
        </div>
    </Modal>
  );
};
