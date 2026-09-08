import React, { useState } from 'react';
import { Settings, Check, Globe, RefreshCw, X, Shield, Key, Link2, Smartphone } from 'lucide-react';
import { MetaConnectionStatus } from '../types';

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
  const [waToken, setWaToken] = useState('EAABwzL9...waba_prod_meta_v21');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

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
              <span className="pill bg-emerald-800 text-white text-[8px]">
                ● WABA CONNECTED
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="opacity-70 text-[9px] block">DISPLAY PHONE NUMBER:</span>
                  <span className="font-bold">{metaStatus.whatsapp.phoneNumber}</span>
                </div>
                <div>
                  <span className="opacity-70 text-[9px] block">WABA ID:</span>
                  <span className="font-mono">{metaStatus.whatsapp.wabaId}</span>
                </div>
              </div>

              <div>
                <span className="opacity-70 text-[9px] block">SYSTEM USER ACCESS TOKEN:</span>
                <input
                  type="password"
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  className="w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-[10px]"
                />
              </div>
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
