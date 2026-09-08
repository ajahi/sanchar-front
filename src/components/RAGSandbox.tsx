import React, { useState } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
  Flame,
  Languages,
  RotateCcw,
} from 'lucide-react';
import { InventoryItem, StoreFAQ, MerchantSettings, RAGQueryResult, PlatformChannel } from '../types';

interface RAGSandboxProps {
  inventory: InventoryItem[];
  faqs: StoreFAQ[];
  settings: MerchantSettings;
  onInjectSimulatedMessage: (channel: PlatformChannel, senderName: string, text: string, ragResult: RAGQueryResult) => void;
}

export const RAGSandbox: React.FC<RAGSandboxProps> = ({
  inventory,
  faqs,
  settings,
  onInjectSimulatedMessage,
}) => {
  const [queryInput, setQueryInput] = useState('Esko price kati ho bro? Ruby red pashmina shawl stock ma cha?');
  const [selectedChannel, setSelectedChannel] = useState<PlatformChannel>('instagram');
  const [customerName, setCustomerName] = useState('Sunita Shrestha (@sunita.np)');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presetQueries = [
    {
      title: 'Price & Stock (Nepglish)',
      text: 'Esko price kati ho bro? Ruby red pashmina shawl stock ma cha?',
      channel: 'instagram' as PlatformChannel,
      desc: 'Tests Nepali Romanized inquiry against SKU PASH-01',
    },
    {
      title: 'Pokhara Delivery & COD',
      text: 'Delivery Pokhara ma huncha ki nai? Cash on delivery cha hajur?',
      channel: 'facebook' as PlatformChannel,
      desc: 'Tests Nepal outside-valley shipping rates and COD policies',
    },
    {
      title: 'Manager Escalation Trigger',
      text: 'Delivery ekdam delay bhayo! Manager sanga kura garnu cha urgent, phone number dinu.',
      channel: 'whatsapp' as PlatformChannel,
      desc: 'Explicit human escalation request: triggers NEEDS_HUMAN regardless of threshold',
    },
    {
      title: 'Size Exchange Policy',
      text: 'Size milena bhane 7 din bhitra exchange garna milcha? Kasari pathaune?',
      channel: 'instagram' as PlatformChannel,
      desc: 'Tests return & exchange timeline and tagging requirements',
    },
    {
      title: 'Physical Store Location',
      text: 'Hajur ko store kata cha? Thamel showroom visit garna milcha?',
      channel: 'facebook' as PlatformChannel,
      desc: 'Tests Thamel Mandala Street opening hours and address',
    },
    {
      title: 'Out-of-Catalog / Low Confidence',
      text: 'Can you custom stitch a bridal velvet lehenga with gold zardozi work and ship to Texas USA?',
      channel: 'whatsapp' as PlatformChannel,
      desc: 'Tests low confidence handling (<0.75) for out-of-catalog customized inquiries',
    },
  ];

  const handleRunEvaluation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryInput.trim(),
          inventory,
          faqs,
          merchantSettings: settings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('RAG test failed:', err);
      setError(err.message || 'Failed to query RAG engine');
    } finally {
      setLoading(false);
    }
  };

  const handleInject = () => {
    if (!result) return;
    onInjectSimulatedMessage(selectedChannel, customerName, queryInput, result);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Ribbon */}
      <div className="bg-[#FAF3E0] border-3 border-[#1A1A1A] p-4 shadow-[5px_5px_0_#1A1A1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#B8251B] text-white text-[10px] font-mono-retro font-bold px-2 py-0.5 border border-[#1A1A1A]">
              STAGE 3 TESTING
            </span>
            <span className="text-xs font-mono-retro text-[#B8251B] font-bold uppercase">
              NLP & RAG EVALUATION BENCH
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-serif-vintage font-bold text-[#1A2B4C] mt-1">
            Multilingual Context Sandbox & Confidence Verifier
          </h2>
          <p className="text-xs font-mono-retro text-[#1A1A1A]/80 mt-0.5">
            Test English, Nepali (नेपाली), and Romanized Nepglish customer inquiries against your store inventory before going live.
          </p>
        </div>

        <div className="bg-[#FFFDF9] px-3 py-2 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] text-right shrink-0">
          <div className="text-[10px] font-mono-retro text-gray-500 uppercase">ESCALATION THRESHOLD</div>
          <div className="text-base font-serif-vintage font-bold text-[#B8251B]">
            &lt; {(settings.confidenceThreshold * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Main Grid: Input Bench on Left, Output Analysis on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANE: Input & Presets */}
        <div className="lg:col-span-6 space-y-4">
          <div className="matchbox-card p-4">
            <h3 className="font-serif-vintage font-bold text-sm text-[#1A2B4C] mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B8251B]" />
              INPUT CUSTOMER INQUIRY
            </h3>

            <form onSubmit={handleRunEvaluation} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono-retro font-bold text-[#1A1A1A] mb-1">
                  Query Text (Type in English, Devanagari नेपाली, or Romanized Nepglish):
                </label>
                <textarea
                  id="textarea-sandbox-query"
                  rows={4}
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="e.g., Esko price kati ho bro? Delivery Pokhara ma huncha?"
                  className="w-full p-3 bg-[#FAF3E0] border-2 border-[#1A1A1A] text-xs font-mono-retro focus:outline-none focus:bg-white shadow-[3px_3px_0_#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono-retro font-bold text-gray-700 mb-1">
                    SIMULATE CHANNEL:
                  </label>
                  <select
                    id="select-sandbox-channel"
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value as PlatformChannel)}
                    className="w-full p-2 bg-[#FFFDF9] border-2 border-[#1A1A1A] text-xs font-mono-retro focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  >
                    <option value="instagram">Instagram Direct (DM)</option>
                    <option value="facebook">Facebook Messenger</option>
                    <option value="whatsapp">WhatsApp Cloud API (WABA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono-retro font-bold text-gray-700 mb-1">
                    CUSTOMER SENDER NAME:
                  </label>
                  <input
                    id="input-sandbox-customer"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 bg-[#FFFDF9] border-2 border-[#1A1A1A] text-xs font-mono-retro focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  id="btn-run-evaluation"
                  type="submit"
                  disabled={loading}
                  className="matchbox-button-primary px-5 py-2.5 text-xs font-mono-retro font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[#E09A25]" />
                  {loading ? 'EVALUATING CONTEXT...' : 'RUN RAG INFERENCE'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQueryInput('');
                    setResult(null);
                  }}
                  className="p-2 text-xs font-mono-retro text-gray-600 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </form>
          </div>

          {/* Realistic Nepglish / Nepali Preset Queries */}
          <div className="matchbox-card p-4">
            <h3 className="font-serif-vintage font-bold text-xs text-[#1A2B4C] mb-2 uppercase tracking-wide">
              ★ CLICK-TO-TEST REALISTIC NEPAL SOCIAL COMMERCE QUERIES:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presetQueries.map((preset, idx) => (
                <button
                  key={idx}
                  id={`btn-preset-${idx}`}
                  onClick={() => {
                    setQueryInput(preset.text);
                    setSelectedChannel(preset.channel);
                  }}
                  className="text-left p-2.5 bg-[#FAF3E0] hover:bg-[#F5EBE0] border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] font-mono-retro text-[#B8251B]">
                      {preset.title}
                    </span>
                    <span className="text-[9px] font-mono-retro bg-[#FFFDF9] px-1 border border-[#1A1A1A]">
                      {preset.channel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono-retro text-gray-800 line-clamp-2">
                    "{preset.text}"
                  </p>
                  <div className="text-[9px] font-mono-retro text-gray-500 mt-1">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: RAG Engine Breakdown & Verification */}
        <div className="lg:col-span-6 space-y-4">
          <div className="matchbox-card p-4 min-h-[440px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#B8251B]" />
                  <h3 className="font-serif-vintage font-bold text-sm text-[#1A2B4C]">
                    INFERENCE TELEMETRY & DECISION GAUGE
                  </h3>
                </div>
                {result && (
                  <span
                    className={`text-[10px] font-mono-retro font-bold px-2 py-0.5 border border-[#1A1A1A] ${
                      result.needsHuman
                        ? 'bg-[#B8251B] text-white animate-pulse'
                        : 'bg-[#E09A25] text-[#1A1A1A]'
                    }`}
                  >
                    {result.needsHuman ? 'HANDOVER: TRIGGERED' : 'AUTO-PILOT: CLEAR'}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <Flame className="w-10 h-10 text-[#E09A25] mx-auto animate-bounce" />
                  <p className="font-serif-vintage font-bold text-base text-[#1A2B4C]">
                    Striking match on merchant context...
                  </p>
                  <p className="text-xs font-mono-retro text-gray-600">
                    Retrieving catalog embeddings and matching Nepali / Nepglish phrases
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-100 border-2 border-red-700 text-red-900 text-xs font-mono-retro">
                  Error: {error}
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {/* Metric Gauges Row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* Confidence */}
                    <div className="p-2.5 bg-[#FAF3E0] border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
                      <div className="text-[9px] font-mono-retro text-gray-600 uppercase font-bold">
                        CONFIDENCE SCORE
                      </div>
                      <div
                        className={`text-xl font-serif-vintage font-black mt-0.5 ${
                          result.confidence >= settings.confidenceThreshold
                            ? 'text-emerald-700'
                            : 'text-[#B8251B]'
                        }`}
                      >
                        {(result.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-[9px] font-mono-retro text-gray-500">
                        {result.confidence >= settings.confidenceThreshold ? 'SAFE (>= 75%)' : 'LOW (< 75%)'}
                      </div>
                    </div>

                    {/* Intent */}
                    <div className="p-2.5 bg-[#FAF3E0] border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
                      <div className="text-[9px] font-mono-retro text-gray-600 uppercase font-bold">
                        CLASSIFIED INTENT
                      </div>
                      <div className="text-xs font-mono-retro font-bold text-[#1A2B4C] mt-1 break-words">
                        {result.intent}
                      </div>
                      <div className="text-[9px] font-mono-retro text-gray-500">
                        RAG Classifier
                      </div>
                    </div>

                    {/* Language */}
                    <div className="p-2.5 bg-[#FAF3E0] border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
                      <div className="text-[9px] font-mono-retro text-gray-600 uppercase font-bold">
                        DETECTED LANGUAGE
                      </div>
                      <div className="text-xs font-mono-retro font-bold text-[#B8251B] mt-1">
                        {result.detectedLanguage}
                      </div>
                      <div className="text-[9px] font-mono-retro text-gray-500">
                        NLP Pipeline
                      </div>
                    </div>
                  </div>

                  {/* Escalation Alert Callout if Triggered */}
                  {result.needsHuman && (
                    <div className="p-3 bg-red-100/80 border-2 border-[#B8251B] text-xs font-mono-retro">
                      <div className="flex items-center gap-1.5 font-bold text-[#B8251B] mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        ESCALATION CRITERIA SATISFIED:
                      </div>
                      <p className="text-red-950">
                        {result.escalationReason ||
                          `Confidence score (${(result.confidence * 100).toFixed(0)}%) is beneath safety threshold (${(settings.confidenceThreshold * 100).toFixed(0)}%). Thread marked NEEDS_HUMAN.`}
                      </p>
                    </div>
                  )}

                  {/* Generated AI Output Bubble */}
                  <div>
                    <label className="block text-[10px] font-mono-retro font-bold text-gray-700 uppercase mb-1">
                      GENERATED OUTBOUND MESSAGE:
                    </label>
                    <div className="p-3 bg-[#FAF3E0] border-2 border-[#B8251B] shadow-[3px_3px_0_#1A1A1A] text-xs font-mono-retro leading-relaxed text-[#1A1A1A]">
                      {result.response}
                    </div>
                  </div>

                  {/* Retrieved Citations */}
                  <div>
                    <label className="block text-[10px] font-mono-retro font-bold text-gray-700 uppercase mb-1">
                      RETRIEVED CONTEXT CHUNKS ({result.citations?.length || 0}):
                    </label>
                    <div className="space-y-1.5">
                      {result.citations && result.citations.length > 0 ? (
                        result.citations.map((c, i) => (
                          <div
                            key={i}
                            className="p-2 bg-[#FFFDF9] border border-[#1A1A1A] text-[11px] font-mono-retro flex items-start gap-2"
                          >
                            <span className="bg-[#E09A25] text-[#1A1A1A] text-[9px] font-bold px-1 uppercase shrink-0 mt-0.5 border border-[#1A1A1A]">
                              {c.type}
                            </span>
                            <div>
                              <div className="font-bold text-[#1A2B4C]">{c.title}</div>
                              <div className="text-gray-600 text-[10px]">{c.snippet}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-[10px] font-mono-retro text-gray-500 italic bg-[#FAF3E0] border border-[#1A1A1A]/30">
                          No direct catalog item matched. Fallback reasoning applied.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Internal Reasoning */}
                  {result.reasoning && (
                    <div className="text-[11px] font-mono-retro text-gray-700 bg-[#FAF3E0]/70 p-2 border border-[#1A1A1A]/40">
                      <span className="font-bold text-[#1A2B4C]">Reasoning:</span> {result.reasoning}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-mono-retro text-gray-500 space-y-2">
                  <HelpCircle className="w-8 h-8 mx-auto text-gray-400" />
                  <p>No evaluation run yet.</p>
                  <p className="text-[10px]">
                    Select any preset query on the left or type your own question to run real-time inference.
                  </p>
                </div>
              )}
            </div>

            {/* Injection Action Bar */}
            {result && (
              <div className="mt-4 pt-3 border-t-2 border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] font-mono-retro text-gray-700">
                  Ready to test with real Meta webhook dispatch?
                </span>
                <button
                  id="btn-inject-to-inbox"
                  type="button"
                  onClick={handleInject}
                  className="matchbox-button-ochre px-4 py-2 text-xs font-mono-retro font-bold flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  DISPATCH TO LIVE INBOX
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
