import React, { useState } from 'react';
import { ConversationThread, ChannelType } from '../types';
import { AlertTriangle, History, Bot, UserCheck, Instagram, Facebook, MessageCircle } from 'lucide-react';

const CHANNEL = {
  instagram: { label: 'Instagram', Icon: Instagram, bg: 'bg-[#B8251B]' },
  facebook: { label: 'Messenger', Icon: Facebook, bg: 'bg-[#1A2B4C]' },
  whatsapp: { label: 'WhatsApp', Icon: MessageCircle, bg: 'bg-emerald-700' },
} as const;
import { syncHistory } from '../api';
import { Skeleton } from './Skeleton';

interface SidebarNavProps {
  threads: ConversationThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  selectedChannelFilter: 'all' | ChannelType;
  onChangeChannelFilter: (filter: 'all' | ChannelType) => void;
  filterNeedsHumanOnly: boolean;
  onToggleNeedsHumanFilter: () => void;
  loading: boolean; // first conversations fetch still in flight
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  loading,
  threads,
  activeThreadId,
  onSelectThread,
  selectedChannelFilter,
  onChangeChannelFilter,
  filterNeedsHumanOnly,
  onToggleNeedsHumanFilter,
}) => {
  const [sync, setSync] = useState({ busy: false, note: '' });
  const loadOlder = () => {
    setSync({ busy: true, note: '' });
    syncHistory()
      .then((r) =>
        r.started
          ? 'Fetching older chats from Meta… they appear below as they arrive.'
          : r.already_running
            ? 'Already fetching older chats…'
            : 'No Instagram or Messenger account is connected.'
      )
      .catch((e: Error) => e.message)
      .then((note) => {
        setSync({ busy: false, note });
        setTimeout(() => setSync((s) => ({ ...s, note: '' })), 8000);
      });
  };

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

        {/* Pull older chats from Meta (Instagram + Messenger), 50 per click */}
        <button
          id="load-older-chats-btn"
          onClick={loadOlder}
          disabled={sync.busy}
          title="Fetch older Instagram and Messenger conversations from Meta (50 per click)"
          className="w-full mt-2 py-1 px-2 text-[10px] font-black uppercase flex items-center justify-center gap-1 border-2 border-black bg-white text-[#1A2B4C] hover:bg-[#FAF3E0] cursor-pointer disabled:opacity-60"
        >
          <History className={`w-3 h-3 ${sync.busy ? 'animate-spin' : ''}`} />
          {sync.busy ? 'STARTING…' : 'LOAD OLDER CHATS'}
        </button>
        {sync.note && (
          <p role="status" className="mt-1 text-[10px] font-mono text-[#1A1A1A]/70">
            {sync.note}
          </p>
        )}
      </div>

      {/* Threads List */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
        <p className="text-[10px] font-black uppercase text-[#1A1A1A]/70 px-1">
          CONVERSATIONS ({filteredThreads.length})
        </p>

        {loading ? (
          <div role="status" aria-label="Loading conversations" className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="p-2.5 border-2 border-black bg-[#FAF3E0] shadow-[2px_2px_0px_#1A1A1A] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-black bg-white/60 text-center text-xs">
            No threads match the selected filter.
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isSelected = thread.id === activeThreadId;
            const lastMsg = thread.messages[thread.messages.length - 1];
            const isEscalated = thread.status === 'NEEDS_HUMAN';
            const hasLead = !!thread.leadPhone;

            return (
              <div
                key={thread.id}
                id={`thread-card-${thread.id}`}
                onClick={() => onSelectThread(thread.id)}
                title={isEscalated ? 'Needs a person: reply to clear this' : hasLead ? 'Shared a phone number: sales lead' : undefined}
                className={`cursor-pointer transition-all relative ${
                  isEscalated
                    ? 'needs-attention-pulse border-[5px] border-[#B8251B] p-[7px]' // thicker border, padding trimmed so the card keeps its size
                    : `p-2.5 border-2 shadow-[2px_2px_0px_#1A1A1A] ${
                        hasLead
                          ? 'bg-emerald-100 border-emerald-700 hover:bg-emerald-200'
                          : 'bg-white border-black hover:bg-[#FAF3E0]'
                      }`
                } ${isSelected ? 'translate-x-0.5' : ''}`}
              >
                <div className="flex gap-2.5">
                {/* Avatar: initial, channel icon in the corner (tooltip) */}
                <div className="relative w-10 h-10 shrink-0 rounded-full border-2 border-black bg-[#FAF3E0] flex items-center justify-center font-bold text-sm">
                  {(thread.customerName?.match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase()}
                  <span
                    title={CHANNEL[thread.channel].label}
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-black flex items-center justify-center text-white ${CHANNEL[thread.channel].bg}`}
                  >
                    {React.createElement(CHANNEL[thread.channel].Icon, { className: 'w-2.5 h-2.5' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                {/* Header of thread card */}
                <div className="flex items-center justify-between mb-1 gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs text-[#1A1A1A] truncate">
                      {thread.customerName}
                    </span>
                    {hasLead && (
                      <span className="shrink-0 text-[8px] font-bold font-mono bg-emerald-700 text-white px-1 border border-black">
                        📞 LEAD
                      </span>
                    )}
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
                <p className="text-[11px] text-[#1A1A1A] truncate italic">
                  {lastMsg?.sender === 'human' && <span title="Operator override: a person replied"><UserCheck className="inline w-3 h-3 mr-1 text-[#B8251B]" /></span>}
                  {lastMsg?.sender === 'ai' && <span title="Replied by AI"><Bot className="inline w-3 h-3 mr-1 text-[#8F1810]" /></span>}
                  &ldquo;{lastMsg ? lastMsg.text : 'No messages yet'}&rdquo;
                </p>
                </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </aside>
  );
};
