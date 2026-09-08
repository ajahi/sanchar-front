import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Radio,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { ChannelConnection, PlatformChannel } from '../types';

interface ChannelIntegrationsProps {
  channels: ChannelConnection[];
  onToggleChannel: (channel: PlatformChannel) => void;
}

export const ChannelIntegrations: React.FC<ChannelIntegrationsProps> = ({
  channels,
  onToggleChannel,
}) => {
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testLog, setTestLog] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestHandshake = async (ch: ChannelConnection) => {
    setTestingChannel(ch.channel);
    setTestLog(null);

    try {
      const response = await fetch('/api/meta/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: ch.channel,
          accountId: ch.accountId,
          token: ch.verifyToken,
        }),
      });
      const data = await response.json();
      setTestLog(data);
    } catch (err) {
      setTestLog({
        success: false,
        error: 'Failed to complete handshake',
      });
    } finally {
      setTestingChannel(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#FAF3E0] border-3 border-[#1A1A1A] p-4 shadow-[5px_5px_0_#1A1A1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#B8251B] text-white text-[10px] font-mono-retro font-bold px-2 py-0.5 border border-[#1A1A1A]">
              STAGE 2 INTEGRATION
            </span>
            <span className="text-xs font-mono-retro text-[#B8251B] font-bold uppercase">
              META GRAPH API v21.0 OMNICHANNEL GATEWAY
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-serif-vintage font-bold text-[#1A2B4C] mt-1">
            Facebook Messenger, Instagram Direct & WhatsApp Cloud API
          </h2>
          <p className="text-xs font-mono-retro text-[#1A1A1A]/80 mt-0.5">
            Configure Webhook endpoints, verify tokens, and manage Meta permissions to auto-route inbound customer messages.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#FFFDF9] border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <div className="text-xs font-mono-retro font-bold text-[#1A1A1A]">
            GATEWAY STATUS: LISTENING
          </div>
        </div>
      </div>

      {/* Handshake Result Notification */}
      {testLog && (
        <div className="p-3.5 bg-[#FFFDF9] border-3 border-[#1A1A1A] shadow-[4px_4px_0_#1A1A1A] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-serif-vintage font-bold text-[#1A2B4C]">
                Meta Graph API v21.0 Webhook Test Completed:
              </div>
              <div className="text-xs font-mono-retro text-gray-800 mt-0.5">
                {testLog.message || 'Webhook verification handshake validated.'}
              </div>
              <div className="text-[10px] font-mono-retro text-gray-500 mt-1">
                Channel: {testLog.channel?.toUpperCase()} • Verified at {testLog.verifiedAt}
              </div>
            </div>
          </div>
          <button
            onClick={() => setTestLog(null)}
            className="text-xs font-mono-retro text-gray-600 hover:text-black underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {channels.map((ch) => {
          const isFb = ch.channel === 'facebook';
          const isIg = ch.channel === 'instagram';
          const isWa = ch.channel === 'whatsapp';

          return (
            <div
              key={ch.channel}
              className="matchbox-card p-4 flex flex-col justify-between border-t-8 border-t-[#B8251B] relative"
            >
              <div>
                {/* Channel Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span
                      className={`text-[9px] font-mono-retro font-bold px-2 py-0.5 border border-[#1A1A1A] uppercase ${
                        isFb
                          ? 'bg-[#1877F2] text-white'
                          : isIg
                          ? 'bg-[#E1306C] text-white'
                          : 'bg-[#25D366] text-[#1A1A1A]'
                      }`}
                    >
                      {ch.channel.toUpperCase()}
                    </span>
                    <h3 className="font-serif-vintage font-bold text-base text-[#1A2B4C] mt-1.5">
                      {ch.title}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-mono-retro font-bold px-1.5 py-0.5 border border-[#1A1A1A] ${
                      ch.connected
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    {ch.connected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>

                {/* Account Details */}
                <div className="space-y-2.5 text-xs font-mono-retro bg-[#FAF3E0] p-3 border border-[#1A1A1A] mb-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">LINKED ACCOUNT</div>
                    <div className="font-bold text-[#1A1A1A]">{ch.accountName}</div>
                    <div className="text-[10px] text-gray-600">ID: {ch.accountId}</div>
                  </div>

                  {ch.wabaId && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">WABA ID & PHONE</div>
                      <div className="text-[11px] font-mono-retro text-[#1A1A1A]">{ch.wabaId}</div>
                      <div className="text-[10px] text-gray-600">{ch.phoneNumberId}</div>
                    </div>
                  )}

                  {ch.qualityRating && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">WABA TIER QUALITY</div>
                      <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 font-bold">
                        ★ {ch.qualityRating} RATING (GREEN)
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">SUBSCRIBED EVENTS</div>
                    <div className="text-[10px] text-gray-700">
                      messages, messaging_postbacks, message_deliveries
                    </div>
                  </div>
                </div>

                {/* Webhook Configuration fields */}
                <div className="space-y-2 text-xs font-mono-retro">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 mb-0.5">
                      <span>WEBHOOK CALLBACK URL:</span>
                      <button
                        onClick={() => copyToClipboard(ch.webhookUrl, `wh_${ch.channel}`)}
                        className="text-[#B8251B] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedField === `wh_${ch.channel}` ? 'COPIED!' : 'COPY'}
                      </button>
                    </div>
                    <div className="p-1.5 bg-[#FFFDF9] border border-[#1A1A1A] text-[10px] font-mono-retro text-gray-800 truncate">
                      {ch.webhookUrl}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 mb-0.5">
                      <span>VERIFY TOKEN:</span>
                      <button
                        onClick={() => copyToClipboard(ch.verifyToken, `tok_${ch.channel}`)}
                        className="text-[#B8251B] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedField === `tok_${ch.channel}` ? 'COPIED!' : 'COPY'}
                      </button>
                    </div>
                    <div className="p-1.5 bg-[#FFFDF9] border border-[#1A1A1A] text-[10px] font-mono-retro text-gray-800 truncate">
                      {ch.verifyToken}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#1A1A1A]/20 flex items-center justify-between gap-2">
                <button
                  id={`btn-handshake-${ch.channel}`}
                  onClick={() => handleTestHandshake(ch)}
                  disabled={testingChannel === ch.channel}
                  className="matchbox-button-secondary px-2.5 py-1.5 text-[10px] font-mono-retro font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${testingChannel === ch.channel ? 'animate-spin' : ''}`} />
                  {testingChannel === ch.channel ? 'TESTING...' : 'TEST HANDSHAKE'}
                </button>

                <button
                  onClick={() => onToggleChannel(ch.channel)}
                  className="px-2.5 py-1.5 bg-[#FAF3E0] hover:bg-white text-[10px] font-mono-retro font-bold border border-[#1A1A1A] cursor-pointer"
                >
                  {ch.connected ? 'PAUSE' : 'ACTIVATE'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Meta Webhook Architecture Diagram & Spec Card */}
      <div className="matchbox-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-[#B8251B]" />
          <h3 className="font-serif-vintage font-bold text-sm text-[#1A2B4C] uppercase">
            GRAPH API INBOUND INGESTION & DEDUPLICATION SPECIFICATION
          </h3>
        </div>
        <p className="text-xs font-mono-retro text-gray-700 leading-relaxed">
          Inbound Meta Webhook POST requests pass through the unified router route (`/api/meta/webhook`). Inbound message IDs are deduplicated in memory against double-delivery retries from Meta servers. Messages within the 24-hour customer service window are automatically evaluated against the RAG context.
        </p>

        <div className="mt-3 p-3 bg-[#1A1A1A] text-[#FAF3E0] font-mono-retro text-[11px] overflow-x-auto border-2 border-[#E09A25]">
          <pre>{`POST /api/meta/webhook
Headers: X-Hub-Signature-256: sha256={hash}
Payload: {
  "object": "page | instagram | whatsapp_business_account",
  "entry": [{
    "id": "10948271039",
    "messaging": [{
      "sender": { "id": "customer_psid_49102" },
      "message": { "mid": "m_mid_829104", "text": "Esko price kati ho bro?" }
    }]
  }]
}
Response: 200 OK -> { "status": "EVENT_RECEIVED", "deduplicated": true }`}</pre>
        </div>
      </div>
    </div>
  );
};
