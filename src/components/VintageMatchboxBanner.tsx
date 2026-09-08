import React from 'react';
import { Flame, Star, Shield, Sparkles } from 'lucide-react';

export const VintageMatchboxBanner: React.FC = () => {
  return (
    <div className="w-full bg-[#FFFDF9] border-4 border-[#1A1A1A] p-2 sm:p-3 shadow-[6px_6px_0_#1A1A1A] relative overflow-hidden mb-6">
      {/* Outer Vermilion Double Border */}
      <div className="border-3 border-[#B8251B] p-2 sm:p-3 relative bg-[#FAF3E0]/70">
        {/* Corner Stamped Ornaments */}
        <div className="absolute top-1 left-1 text-[10px] font-mono-retro font-black text-[#B8251B]">★ 1926 ★</div>
        <div className="absolute top-1 right-1 text-[10px] font-mono-retro font-black text-[#B8251B]">★ 1926 ★</div>
        <div className="absolute bottom-1 left-1 text-[10px] font-mono-retro font-black text-[#B8251B]">SIVAKASI</div>
        <div className="absolute bottom-1 right-1 text-[10px] font-mono-retro font-black text-[#B8251B]">KATHMANDU</div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-1">
          {/* Left Matchbox Trademark Emblem */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FAF3E0] border-3 border-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] flex flex-col items-center justify-center p-1 relative shrink-0">
              <div className="w-full h-full border-2 border-dashed border-[#B8251B] flex flex-col items-center justify-center">
                <Flame className="w-8 h-8 text-[#B8251B]" />
                <span className="text-[7px] font-mono-retro font-bold text-[#1A2B4C] uppercase tracking-tighter">
                  HIND MATA
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-[#E09A25] text-[#1A1A1A] text-[9px] font-mono-retro font-black px-1.5 py-0.2 border border-[#1A1A1A]">
                  GENUINE QUALITY
                </span>
                <span className="bg-[#B8251B] text-white text-[9px] font-mono-retro font-bold px-1.5 py-0.2 border border-[#1A1A1A]">
                  DAMP PROOF
                </span>
                <span className="text-[10px] font-mono-retro text-[#1A2B4C] font-bold">
                  REGISTERED NO. 49102-NP
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif-vintage font-black text-[#1A2B4C] tracking-wide mt-1 uppercase">
                THE HIMALAYAN SAFETY MATCH
              </h2>

              <p className="text-xs font-mono-retro text-gray-800 mt-0.5 max-w-xl">
                Context-Aware RAG Engine for Facebook Messenger, Instagram Direct & WhatsApp Cloud API.
                Natively fluent in Nepali, Romanized Nepglish, and English with automatic human escalation.
              </p>
            </div>
          </div>

          {/* Right Ribbon & Specifications */}
          <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0">
            <div className="px-3 py-1 bg-[#1A2B4C] text-[#FAF3E0] text-[10px] font-mono-retro font-bold border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] uppercase tracking-widest text-center">
              WIMCO & SIVAKASI TRADITION
            </div>
            <div className="text-[11px] font-mono-retro text-[#B8251B] font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E09A25]" />
              CONFIDENCE ESCALATION: &lt; 0.75
            </div>
          </div>
        </div>

        {/* Bottom Strikepad Band */}
        <div className="w-full h-2 mt-2 strikepad-edge border border-[#1A1A1A]" />
      </div>
    </div>
  );
};
