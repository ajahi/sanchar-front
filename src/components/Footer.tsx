import React from 'react';

interface FooterProps {
  systemId?: string;
  latencyMs?: number;
  tokenUsage?: number;
}

export const Footer: React.FC<FooterProps> = ({
  systemId = 'SS-AI-KATHMANDU-01',
  latencyMs = 120,
  tokenUsage = 412,
}) => {
  return (
    <footer className="h-8 bg-black text-white flex items-center px-4 justify-between text-[10px] font-mono font-bold select-none shrink-0 border-t-2 border-black">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
        <span>SYSTEM ID: {systemId}</span>
        <span className="text-white/40 hidden md:inline">•</span>
        <span className="text-[#E09A25] hidden md:inline">META GRAPH API v21.0 ACTIVE</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <span>LATENCY: {(latencyMs / 100).toFixed(1)}s</span>
        <span>TOKEN_USAGE: {tokenUsage}/10000</span>
        <span className="hidden sm:inline">(C) 2026 SOCIALSYNC AI • VINTAGE MATCHBOX GRADE</span>
      </div>
    </footer>
  );
};
