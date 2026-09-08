import React, { useState } from 'react';
import { Sparkles, Send, Bot, AlertTriangle, ShieldCheck, CheckCircle, RefreshCw, X } from 'lucide-react';
import { ChannelType, RAGSimulationResult } from '../types';

interface RAGSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  confidenceThreshold: number;
}

export const RAGSandboxModal: React.FC<RAGSandboxModalProps> = ({
  isOpen,
  onClose,
  confidenceThreshold,
}) => {
  const [query, setQuery] = useState('Esko price kati ho ani Pokhara ma delivery huncha?');
  const [channel, setChannel] = useState<ChannelType>('instagram');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RAGSimulationResult | null>(null);

  if (!isOpen) return null;

  const sampleQueries = [
    { label: '🇳🇵 Nepglish Price & Pokhara Delivery', text: 'Esko price kati ho ani Pokhara ma delivery huncha?' },
    { label: '🚨 Manager Escalation Request', text: 'Malai discount chahiyo, manager sanga kura garnu cha.' },
    { label: '🇳🇵 Pure Nepali: Dhaka Topi', text: 'नमस्ते, ढाका टोपी कति पर्छ र साइज कस्तो छ?' },
    { label: '🚚 Shipping Duration to Butwal', text: 'Butwal ma kahile samma aipugcha? Delivery charge kati ho?' },
    { label: '💳 Payment / Cash on Delivery', text: 'Cash on delivery milcha ki E-Sewa bata garnu parcha?' },
    { label: '❓ Ambiguous / Low Confidence Query', text: 'Yo item ma blue color ko border liyera pathauna milcha bholi 3 baje?' }
  ];

  const handleTest = async (testQuery = query) => {
    if (!testQuery.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/rag/process-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          channel,
          confidenceThreshold
        })
      });
      const data = await res.json();
      setResult({
        query: testQuery,
        answer: data.answer,
        confidence: data.confidence,
        intent: data.intent,
        needsHuman: data.needsHuman,
        humanReason: data.humanReason,
        entities: data.entities || [],
        sources: data.sources || ['STORE_CONTEXT_INDEX']
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none">
      <div className="matchbox-border bg-[#FAF3E0] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-[8px_8px_0px_#1A1A1A]">
        {/* Modal Header */}
        <div className="vermilion-bg text-white p-3 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h2 className="serif-heading text-lg tracking-tight">
              Merchant RAG Testing Sandbox
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black text-white border border-white/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
          <div className="matchbox-border p-3 bg-white">
            <p className="text-[11px] font-bold text-[#1A2B4C] mb-1 font-serif uppercase">
              Omnichannel Input Configuration
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <label className="text-[10px] font-bold uppercase">Simulated Channel:</label>
              <div className="flex gap-1.5">
                {(['instagram', 'whatsapp', 'facebook'] as ChannelType[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`px-2 py-0.5 border border-black uppercase text-[10px] font-bold cursor-pointer ${
                      channel === ch ? 'bg-[#B8251B] text-white' : 'bg-[#FAF3E0] hover:bg-white text-black'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-[#1A1A1A]/70 ml-auto font-bold">
                Threshold: <span className="text-[#B8251B]">{confidenceThreshold.toFixed(2)}</span>
              </span>
            </div>

            {/* Input textarea */}
            <div className="flex gap-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={2}
                placeholder="Type customer message in English, Nepali or Nepglish..."
                className="flex-1 p-2 border-2 border-black font-mono text-xs bg-[#FAF3E0]/30 focus:outline-none focus:bg-white focus:border-[#B8251B]"
              />
              <button
                onClick={() => handleTest()}
                disabled={isLoading || !query.trim()}
                className="vermilion-bg text-white font-bold px-4 border-2 border-black shadow-[2px_2px_0px_black] hover:bg-[#8F1810] cursor-pointer disabled:opacity-50 flex flex-col items-center justify-center uppercase text-[10px]"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mb-0.5" />
                    <span>EVALUATE</span>
                  </>
                )}
              </button>
            </div>

            {/* Sample Presets */}
            <div className="mt-2 pt-2 border-t border-black/20">
              <span className="text-[9px] font-bold text-[#1A1A1A]/70 uppercase">
                TEST PRESETS (CLICK TO RUN):
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {sampleQueries.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(sq.text);
                      handleTest(sq.text);
                    }}
                    className="text-[10px] bg-[#FAF3E0] hover:bg-amber-100 border border-black/30 hover:border-black px-2 py-0.5 transition-colors cursor-pointer text-[#1A1A1A]"
                  >
                    {sq.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Evaluation Results */}
          {result && (
            <div className="matchbox-border p-4 bg-white space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="serif-heading text-sm text-[#1A2B4C] flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-[#B8251B]" />
                  RAG Generation & Evaluation Report
                </span>
                {result.needsHuman ? (
                  <span className="pill bg-[#B8251B] text-white text-[9px] animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    NEEDS HUMAN HANDOVER
                  </span>
                ) : (
                  <span className="pill bg-emerald-800 text-white text-[9px]">
                    <ShieldCheck className="w-3 h-3" />
                    AUTO-PILOT QUALIFIED
                  </span>
                )}
              </div>

              {/* Confidence Meter */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 border border-black bg-[#FAF3E0]">
                  <span className="text-[9px] font-bold opacity-70">CONFIDENCE SCORE</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-xl font-black ${
                        result.confidence >= confidenceThreshold ? 'text-emerald-800' : 'text-[#B8251B]'
                      }`}
                    >
                      {result.confidence.toFixed(2)}
                    </span>
                    <span className="text-[10px] opacity-60">/ 1.00</span>
                  </div>
                </div>

                <div className="p-2 border border-black bg-[#FAF3E0]">
                  <span className="text-[9px] font-bold opacity-70">CLASSIFIED INTENT</span>
                  <p className="text-xs font-bold text-[#1A2B4C] mt-0.5 uppercase">
                    {result.intent}
                  </p>
                </div>

                <div className="p-2 border border-black bg-[#FAF3E0]">
                  <span className="text-[9px] font-bold opacity-70">CONFIDENCE VERDICT</span>
                  <p className="text-xs font-bold mt-0.5">
                    {result.confidence >= confidenceThreshold ? (
                      <span className="text-emerald-800 font-bold">✓ High Confidence</span>
                    ) : (
                      <span className="text-[#B8251B] font-bold">✗ Below Threshold ({confidenceThreshold})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Reason for escalation if applicable */}
              {result.needsHuman && result.humanReason && (
                <div className="p-2 bg-red-100 border-2 border-[#B8251B] text-[#B8251B] font-bold text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Escalation Trigger: {result.humanReason}</span>
                </div>
              )}

              {/* Answer Box */}
              <div>
                <span className="text-[9px] font-bold opacity-70 uppercase">
                  GENERATED MULTI-LINGUAL RESPONSE
                </span>
                <div className="matchbox-border p-3 mustard-bg mt-1 relative">
                  <p className="text-sm font-mono text-[#1A1A1A] leading-relaxed italic select-text">
                    &ldquo;{result.answer}&rdquo;
                  </p>
                </div>
              </div>

              {/* Entities & Sources */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/20">
                <div>
                  <span className="text-[9px] font-bold opacity-70 uppercase">EXTRACTED ENTITIES:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.entities.length > 0 ? (
                      result.entities.map((e, idx) => (
                        <span key={idx} className="bg-yellow-200 border border-black/40 px-1.5 py-0.5 text-[10px]">
                          <strong>{e.type}:</strong> {e.value}
                        </span>
                      ))
                    ) : (
                      <span className="opacity-50 text-[10px]">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-bold opacity-70 uppercase">KNOWLEDGE SOURCES:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.sources.map((s, idx) => (
                      <span key={idx} className="bg-[#1A2B4C] text-white px-1.5 py-0.5 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t-2 border-black flex justify-between items-center text-[10px] font-mono shrink-0">
          <span>RAG Engine: Context-Aware Retrieval • Meta Graph v21.0 Ready</span>
          <button
            onClick={onClose}
            className="px-4 py-1 border-2 border-black font-bold uppercase hover:bg-[#FAF3E0] cursor-pointer"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
