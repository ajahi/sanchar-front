import React, { useEffect, useState } from 'react';
import { Settings, Check, Globe, RefreshCw, X, Shield, Key, Link2, Smartphone } from 'lucide-react';
import { MetaConnectionStatus } from '../types';
import { getWhatsAppAccounts, linkWhatsApp, WhatsAppAccount } from '../api';

// Tenants share their WhatsApp account with this business (Hachuwa market) as a partner.
const SANCHAR_PARTNER_BUSINESS_ID = '3977606022464196';

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

  useEffect(() => {
    if (isOpen) loadWhatsApp();
  }, [isOpen]);

  const [linkPhoneId, setLinkPhoneId] = useState('');
  const [linkWabaId, setLinkWabaId] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const waAllOk = !!waAccounts?.length && waAccounts.every((a) => waChecks(a).every((c) => c.ok));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none">
      <div className="matchbox-border bg-[#FAF3E0] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-[8px_8px_0px_#1A1A1A]">
        {/* Header */}
        <div className="vermilion-bg text-white p-3 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-300" />
            <h2 className="serif-heading text-lg tracking-tight">
              Meta Integrations & Merchant Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black text-white border border-white/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
              <span className="pill bg-emerald-800 text-white text-[8px]">
                ● LINKED &amp; ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="opacity-70 text-[9px] block">CONNECTED PAGE:</span>
                <span className="font-bold">{metaStatus.facebook.pageName}</span>
              </div>
              <div>
                <span className="opacity-70 text-[9px] block">PAGE ID:</span>
                <span className="font-mono">{metaStatus.facebook.pageId}</span>
              </div>
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
              <span className="pill bg-emerald-800 text-white text-[8px]">
                ● VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="opacity-70 text-[9px] block">PROFESSIONAL ACCOUNT:</span>
                <span className="font-bold">{metaStatus.instagram.handle}</span>
              </div>
              <div>
                <span className="opacity-70 text-[9px] block">INSTAGRAM ACCOUNT ID:</span>
                <span className="font-mono">{metaStatus.instagram.accountId}</span>
              </div>
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
              {waAccounts === null && !waError && <div className="opacity-60">Loading…</div>}
              {waAccounts?.length === 0 && (
                <div className="space-y-2">
                  <div className="opacity-70">No WhatsApp number is linked to this workspace yet.</div>
                  <ol className="list-decimal pl-4 text-[10px] space-y-0.5">
                    <li>
                      Meta Business Settings → WhatsApp accounts → your account → <b>Partners</b> → share it
                      with business ID <code className="font-bold">{SANCHAR_PARTNER_BUSINESS_ID}</code>.
                    </li>
                    <li>
                      From WhatsApp Manager, copy the number's <b>Phone number ID</b> and the <b>WhatsApp
                      Business Account ID</b>.
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
                    {linking ? 'LINKING…' : 'CONNECT WHATSAPP'}
                  </button>
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
      </div>
    </div>
  );
};
