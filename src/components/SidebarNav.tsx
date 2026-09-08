import React from 'react';
import { ConversationThread, ChannelType } from '../types';
import { MessageSquare, Instagram, Facebook, AlertTriangle, ShieldCheck, Filter, Sliders } from 'lucide-react';

interface SidebarNavProps {
  threads: ConversationThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  selectedChannelFilter: 'all' | ChannelType;
  onChangeChannelFilter: (filter: 'all' | ChannelType) => void;
  filterNeedsHumanOnly: boolean;
  onToggleNeedsHumanFilter: () => void;
  confidenceThreshold: number;
  onChangeConfidenceThreshold: (val: number) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  selectedChannelFilter,
  onChangeChannelFilter,
  filterNeedsHumanOnly,
  onToggleNeedsHumanFilter,
  confidenceThreshold,
  onChangeConfidenceThreshold,
}) => {
  // Filter threads
  const filteredThreads = threads.filter((t) => {
    if (selectedChannelFilter !== 'all' && t.channel !== selectedChannelFilter) {
      return false;
    }
    if (filterNeedsHumanOnly && t.status !== 'NEEDS_HUMAN') {
      return false;
    }
    return true;
  });

  const getChannelBadge = (channel: ChannelType) => {
    switch (channel) {
      case 'instagram':
        return (
          <span className="pill vermilion-bg text-white text-[9px] py-0.5 px-1.5 border-black">
            IG DM
          </span>
        );
      case 'whatsapp':
        return (
          <span className="pill bg-emerald-700 text-white text-[9px] py-0.5 px-1.5 border-black">
            WHATSAPP
          </span>
        );
      case 'facebook':
        return (
          <span className="pill bg-[#1A2B4C] text-white text-[9px] py-0.5 px-1.5 border-black">
            FB MSG
          </span>
        );
    }
  };

  return (
    <aside className="border-r-4 border-black flex flex-col p-3 gap-3 overflow-y-auto bg-[#F5EBE0] select-none h-full">
      {/* Channel Filters Ribbon */}
      <div className="matchbox-border p-2.5 aged-paper">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-black indigo-text uppercase tracking-wider font-serif">
            OMNICHANNEL FEEDS
          </p>
          <span className="text-[10px] font-bold bg-[#1A1A1A] text-[#FAF3E0] px-1.5 py-0.2">
            {threads.length} ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          <button
            id="filter-all"
            onClick={() => onChangeChannelFilter('all')}
            className={`text-[10px] font-bold py-1 border border-black cursor-pointer text-center uppercase ${
              selectedChannelFilter === 'all'
                ? 'bg-black text-white'
                : 'bg-white hover:bg-[#FAF3E0] text-black'
            }`}
          >
            ALL
          </button>
          <button
            id="filter-ig"
            onClick={() => onChangeChannelFilter('instagram')}
            className={`text-[10px] font-bold py-1 border border-black cursor-pointer text-center uppercase ${
              selectedChannelFilter === 'instagram'
                ? 'bg-[#B8251B] text-white'
                : 'bg-white hover:bg-[#FAF3E0] text-black'
            }`}
          >
            IG
          </button>
          <button
            id="filter-wa"
            onClick={() => onChangeChannelFilter('whatsapp')}
            className={`text-[10px] font-bold py-1 border border-black cursor-pointer text-center uppercase ${
              selectedChannelFilter === 'whatsapp'
                ? 'bg-emerald-800 text-white'
                : 'bg-white hover:bg-[#FAF3E0] text-black'
            }`}
          >
            WA
          </button>
          <button
            id="filter-fb"
            onClick={() => onChangeChannelFilter('facebook')}
            className={`text-[10px] font-bold py-1 border border-black cursor-pointer text-center uppercase ${
              selectedChannelFilter === 'facebook'
                ? 'bg-[#1A2B4C] text-white'
                : 'bg-white hover:bg-[#FAF3E0] text-black'
            }`}
          >
            FB
          </button>
        </div>

        {/* Needs Human quick toggle */}
        <button
          id="toggle-needs-human-btn"
          onClick={onToggleNeedsHumanFilter}
          className={`w-full mt-2 py-1 px-2 text-[10px] font-black uppercase flex items-center justify-between border-2 border-black cursor-pointer transition-all ${
            filterNeedsHumanOnly
              ? 'bg-[#B8251B] text-white shadow-[2px_2px_0px_#1A1A1A]'
              : 'bg-white text-[#B8251B] hover:bg-red-50'
          }`}
        >
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-current" />
            HUMAN ESCALATIONS
          </span>
          <span className="px-1.5 py-0.2 bg-black text-white text-[9px] rounded-none">
            {threads.filter((t) => t.status === 'NEEDS_HUMAN').length}
          </span>
        </button>
      </div>

      {/* Threads List */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
        <p className="text-[10px] font-black uppercase text-[#1A1A1A]/70 px-1">
          CONVERSATIONS ({filteredThreads.length})
        </p>

        {filteredThreads.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-black bg-white/60 text-center text-xs">
            No threads match the selected filter.
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isSelected = thread.id === activeThreadId;
            const lastMsg = thread.messages[thread.messages.length - 1];
            const isEscalated = thread.status === 'NEEDS_HUMAN';

            return (
              <div
                key={thread.id}
                id={`thread-card-${thread.id}`}
                onClick={() => onSelectThread(thread.id)}
                className={`p-2.5 cursor-pointer border-2 border-black transition-all relative ${
                  isSelected
                    ? 'bg-white shadow-[4px_4px_0px_#1A1A1A] translate-x-0.5'
                    : 'bg-[#FAF3E0] hover:bg-white shadow-[2px_2px_0px_#1A1A1A]'
                } ${isEscalated ? 'border-[#B8251B] outline outline-1 outline-[#B8251B]' : ''}`}
              >
                {/* Header of thread card */}
                <div className="flex items-center justify-between mb-1 gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {getChannelBadge(thread.channel)}
                    <span className="font-bold text-xs text-[#1A1A1A] truncate">
                      {thread.customerName}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#1A1A1A]/60 font-mono shrink-0">
                    {thread.lastSeen}
                  </span>
                </div>

                {/* Handle & City */}
                <div className="flex items-center justify-between text-[10px] text-[#1A1A1A]/70 mb-1.5 font-mono">
                  <span className="truncate">{thread.customerHandle}</span>
                  {thread.customerCity && (
                    <span className="bg-[#E09A25]/30 px-1 border border-black/30 text-[9px]">
                      📍 {thread.customerCity}
                    </span>
                  )}
                </div>

                {/* Last message preview */}
                <p className="text-[11px] text-[#1A1A1A] line-clamp-2 leading-tight italic bg-white/50 p-1 border border-black/20 mb-1.5">
                  &ldquo;{lastMsg ? lastMsg.text : 'No messages yet'}&rdquo;
                </p>

                {/* Status Badges */}
                <div className="flex items-center justify-between pt-1 border-t border-black/10">
                  {isEscalated ? (
                    <span className="text-[9px] font-black bg-[#B8251B] text-white px-1.5 py-0.5 border border-black flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      NEEDS HUMAN
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-emerald-800 text-white px-1.5 py-0.5 border border-black flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      AUTO-PILOT
                    </span>
                  )}

                  <span className="text-[9px] font-mono font-bold bg-[#E09A25] text-black px-1 border border-black">
                    CONF: {thread.confidenceScore.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RAG Confidence Threshold Matchbox Widget */}
      <div className="matchbox-border p-3 mustard-bg mt-auto select-none shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase leading-tight font-serif">
            AI CONFIDENCE THRESHOLD
          </p>
          <Sliders className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <p className="text-2xl font-black font-mono">
            {confidenceThreshold.toFixed(2)}
          </p>
          <span className="text-[9px] font-bold uppercase bg-black text-white px-1 py-0.2">
            ESCALATE IF &lt; {confidenceThreshold.toFixed(2)}
          </span>
        </div>

        <input
          id="confidence-threshold-slider"
          type="range"
          min="0.50"
          max="0.95"
          step="0.05"
          value={confidenceThreshold}
          onChange={(e) => onChangeConfidenceThreshold(parseFloat(e.target.value))}
          className="w-full mt-2 accent-[#B8251B] cursor-pointer"
        />
        <div className="flex justify-between text-[8px] font-mono font-bold mt-0.5 opacity-80">
          <span>0.50 (Permissive)</span>
          <span>0.75 (Default)</span>
          <span>0.95 (Strict)</span>
        </div>
      </div>
    </aside>
  );
};
