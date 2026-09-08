import React from 'react';
import { ConversationThread, InventoryItem } from '../types';
import { Sparkles, MapPin, Tag, Box, BookOpen, Globe } from 'lucide-react';

interface RightInspectorProps {
  activeThread: ConversationThread | null;
  inventory: InventoryItem[];
  defaultLanguage: 'nepali' | 'nepglish' | 'english';
  onChangeLanguage: (lang: 'nepali' | 'nepglish' | 'english') => void;
  onOpenSandbox: () => void;
  onOpenCatalog: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  activeThread,
  inventory,
  defaultLanguage,
  onChangeLanguage,
  onOpenSandbox,
  onOpenCatalog,
}) => {
  return (
    <aside className="border-l-4 border-black flex flex-col p-3 gap-3 bg-[#F0E4D4] overflow-y-auto select-none h-full">
      {/* Live Context Card */}
      <div className="matchbox-border p-3 bg-white">
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2">
          <h3 className="serif-heading text-base tracking-tight text-[#1A2B4C]">
            Live Context
          </h3>
          <span className="text-[9px] font-mono font-bold bg-[#E09A25] text-black px-1 border border-black">
            RAG ACTIVE
          </span>
        </div>

        <div className="space-y-3 font-mono">
          <div>
            <p className="text-[9px] font-bold text-[#1A1A1A]/60 uppercase">
              DETECTED INTENT
            </p>
            <p className="text-xs font-bold uppercase text-[#B8251B] mt-0.5">
              {activeThread ? activeThread.detectedIntent : 'Awaiting conversation...'}
            </p>
          </div>

          <div>
            <p className="text-[9px] font-bold text-[#1A1A1A]/60 uppercase">
              ENTITY EXTRACTION
            </p>
            {activeThread && activeThread.extractedEntities.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {activeThread.extractedEntities.map((ent, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-yellow-200 text-black border border-black/40 px-1.5 py-0.5 font-mono inline-flex items-center gap-1"
                  >
                    <span className="font-bold opacity-75">{ent.type}:</span> {ent.value}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#1A1A1A]/50 italic mt-0.5">
                No entities extracted
              </p>
            )}
          </div>

          <div>
            <p className="text-[9px] font-bold text-[#1A1A1A]/60 uppercase">
              KNOWLEDGE BASE SOURCE
            </p>
            <span className="inline-block mt-0.5 text-[10px] font-bold bg-[#1A2B4C] text-white px-2 py-0.5 border border-black">
              {activeThread ? activeThread.ragSourceDoc : 'DEFAULT_STORE_INDEX'}
            </span>
          </div>
        </div>
      </div>

      {/* Store Catalog Summary */}
      <div className="matchbox-border p-3 aged-paper border-dashed">
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2">
          <h3 className="serif-heading text-base tracking-tight text-[#1A1A1A]">
            Store Catalog
          </h3>
          <button
            onClick={onOpenCatalog}
            className="text-[9px] font-bold underline cursor-pointer text-[#B8251B] hover:text-black font-mono"
          >
            EDIT ALL ({inventory.length})
          </button>
        </div>

        <div className="text-[11px] font-mono space-y-1.5">
          {inventory.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b border-black/20 pb-1"
            >
              <span className="truncate pr-1 font-medium">{item.name.split(' (')[0]}</span>
              <span className="font-bold text-[#8F1810] whitespace-nowrap">
                Rs. {item.price.toLocaleString()}
              </span>
            </div>
          ))}

          <div className="flex justify-between border-b border-black/20 pb-1 font-bold text-[#1A2B4C]">
            <span>Delivery: Pokhara / Valley Bahira</span>
            <span>Rs. 150</span>
          </div>
          <div className="flex justify-between border-b border-black/20 pb-1 font-bold text-[#1A2B4C]">
            <span>Delivery: Kathmandu Valley</span>
            <span>Rs. 100</span>
          </div>

          <div className="mt-2.5 p-2 border border-black bg-white/70">
            <p className="font-bold uppercase text-[9px] text-[#B8251B]">RAG Policy Note:</p>
            <p className="italic leading-tight text-[10px] text-[#1A1A1A]/90 mt-0.5">
              Discount policy: Max 5% automatic on orders above Rs. 5k (Code: VINTAGE5). Special negotiation requires human operator.
            </p>
          </div>
        </div>
      </div>

      {/* Language & Localisation Settings */}
      <div className="matchbox-border p-2.5 bg-white font-mono">
        <p className="text-[9px] font-bold text-[#1A1A1A]/70 uppercase flex items-center gap-1 mb-1 font-serif">
          <Globe className="w-3 h-3 text-[#1A2B4C]" />
          PRIMARY NLP DIALECT
        </p>
        <div className="grid grid-cols-3 gap-1 text-[9px] font-bold uppercase text-center">
          <button
            onClick={() => onChangeLanguage('nepglish')}
            className={`py-1 border border-black cursor-pointer transition-colors ${
              defaultLanguage === 'nepglish'
                ? 'bg-[#B8251B] text-white'
                : 'bg-[#FAF3E0] hover:bg-white text-black'
            }`}
          >
            Nepglish
          </button>
          <button
            onClick={() => onChangeLanguage('nepali')}
            className={`py-1 border border-black cursor-pointer transition-colors ${
              defaultLanguage === 'nepali'
                ? 'bg-[#B8251B] text-white'
                : 'bg-[#FAF3E0] hover:bg-white text-black'
            }`}
          >
            नेपाली
          </button>
          <button
            onClick={() => onChangeLanguage('english')}
            className={`py-1 border border-black cursor-pointer transition-colors ${
              defaultLanguage === 'english'
                ? 'bg-[#B8251B] text-white'
                : 'bg-[#FAF3E0] hover:bg-white text-black'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Interactive Testing Sandbox Button */}
      <button
        onClick={onOpenSandbox}
        className="matchbox-border p-2.5 mustard-bg hover:bg-amber-400 cursor-pointer text-left transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="serif-heading text-xs font-black text-black flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#B8251B]" />
            OPEN RAG SANDBOX
          </span>
          <span className="text-[10px] font-mono group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
        <p className="text-[10px] font-mono text-[#1A1A1A]/80 mt-1">
          Test sample customer prompts & verify LLM output before live automation.
        </p>
      </button>

      {/* Active Channels Stamp Box */}
      <div className="mt-auto p-3 border-4 border-black text-center indigo-text bg-white shadow-[4px_4px_0px_#1A2B4C]">
        <p className="text-xs font-bold tracking-wider font-serif">
          ACTIVE CHANNELS
        </p>
        <div className="flex justify-center gap-3 mt-2">
          {/* Facebook */}
          <div
            className="w-7 h-7 border-2 border-black flex items-center justify-center font-bold text-xs bg-[#1A2B4C] text-white shadow-[1px_1px_0px_black]"
            title="Facebook Messenger (Page Connected)"
          >
            f
          </div>
          {/* Instagram */}
          <div
            className="w-7 h-7 border-2 border-black flex items-center justify-center font-bold text-xs italic bg-[#B8251B] text-white shadow-[1px_1px_0px_black]"
            title="Instagram Direct (Professional Connected)"
          >
            i
          </div>
          {/* WhatsApp */}
          <div
            className="w-7 h-7 border-2 border-black flex items-center justify-center font-bold text-xs bg-emerald-800 text-white shadow-[1px_1px_0px_black]"
            title="WhatsApp Cloud API (WABA Connected)"
          >
            w
          </div>
        </div>
        <p className="text-[9px] font-mono text-emerald-800 font-bold mt-1.5">
          ● Meta Webhooks 200 OK
        </p>
      </div>
    </aside>
  );
};
