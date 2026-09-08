import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  User,
  Bot,
  Sparkles,
  Phone,
  Paperclip,
  Flame,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { ConversationThread, PlatformChannel, MessageStatus, MerchantSettings } from '../types';

interface OmnichannelInboxProps {
  threads: ConversationThread[];
  selectedThreadId: string;
  onSelectThread: (id: string) => void;
  onSendMessage: (threadId: string, text: string, isHuman: boolean) => void;
  onUpdateStatus: (threadId: string, status: MessageStatus) => void;
  settings: MerchantSettings;
}

export const OmnichannelInbox: React.FC<OmnichannelInboxProps> = ({
  threads,
  selectedThreadId,
  onSelectThread,
  onSendMessage,
  onUpdateStatus,
  settings,
}) => {
  const [channelFilter, setChannelFilter] = useState<'all' | PlatformChannel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MessageStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [humanTakeoverMode, setHumanTakeoverMode] = useState<Record<string, boolean>>({});

  const filteredThreads = threads.filter((t) => {
    if (channelFilter !== 'all' && t.channel !== channelFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.senderName.toLowerCase().includes(q) ||
        t.senderHandle.toLowerCase().includes(q) ||
        t.lastMessageText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeThread = threads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || threads[0];
  const isHumanActive = humanTakeoverMode[activeThread?.id] || activeThread?.status === 'NEEDS_HUMAN';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;
    onSendMessage(activeThread.id, inputText.trim(), true);
    setInputText('');
  };

  const getChannelColor = (ch: PlatformChannel) => {
    switch (ch) {
      case 'facebook':
        return 'bg-[#1877F2] text-white';
      case 'instagram':
        return 'bg-[#E1306C] text-white';
      case 'whatsapp':
        return 'bg-[#25D366] text-[#1A1A1A]';
    }
  };

  const getChannelIconLabel = (ch: PlatformChannel) => {
    switch (ch) {
      case 'facebook':
        return 'FB MESSENGER';
      case 'instagram':
        return 'INSTAGRAM DM';
      case 'whatsapp':
        return 'WHATSAPP WABA';
    }
  };

  const nepaliQuickReplies = [
    'Namaste hajur! Kripaya delivery location ra phone number share garidinuhos.',
    'Hajur, yo product stock ma available cha. Price Rs. 4,500/- ho.',
    'Kathmandu bhitra 24 hours ma aipugcha, Cash on Delivery available cha hajur.',
    'Hajur le order confirm garna chahanu huncha bhane name tipaidim?',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-175px)] min-h-[640px]">
      {/* LEFT COLUMN: Thread List & Filters */}
      <div className="lg:col-span-5 flex flex-col matchbox-card h-full overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-3 bg-[#FAF3E0] border-b-3 border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#B8251B] text-white text-[10px] font-mono-retro font-bold px-1.5 py-0.5 border border-[#1A1A1A]">
              SECTION I
            </span>
            <h2 className="font-serif-vintage font-bold text-sm sm:text-base text-[#1A2B4C] tracking-wide">
              UNIFIED FEED DISPATCH
            </h2>
          </div>
          <span className="text-[11px] font-mono-retro text-[#1A1A1A] font-bold">
            {filteredThreads.length} CONVERSATIONS
          </span>
        </div>

        {/* Filter Controls */}
        <div className="p-2.5 bg-[#FFFDF9] border-b-2 border-[#1A1A1A] space-y-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-500" />
            <input
              id="input-search-conversations"
              type="text"
              placeholder="Search customer, handle, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono-retro bg-[#FAF3E0] border-2 border-[#1A1A1A] focus:outline-none focus:bg-white shadow-[2px_2px_0_#1A1A1A]"
            />
          </div>

          {/* Channel Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { id: 'all', label: 'ALL' },
              { id: 'facebook', label: 'FB' },
              { id: 'instagram', label: 'IG' },
              { id: 'whatsapp', label: 'WA' },
            ].map((ch) => (
              <button
                key={ch.id}
                id={`filter-channel-${ch.id}`}
                onClick={() => setChannelFilter(ch.id as any)}
                className={`px-2 py-1 text-[10px] font-mono-retro font-bold border-2 border-[#1A1A1A] cursor-pointer transition-all ${
                  channelFilter === ch.id
                    ? 'bg-[#B8251B] text-white shadow-[2px_2px_0_#1A1A1A]'
                    : 'bg-[#FAF3E0] text-[#1A1A1A] hover:bg-white'
                }`}
              >
                {ch.label}
              </button>
            ))}

            <div className="h-4 w-px bg-[#1A1A1A] mx-1" />

            {/* Status Filters */}
            {[
              { id: 'all', label: 'STATUS: ALL' },
              { id: 'NEEDS_HUMAN', label: '⚠ HUMAN' },
              { id: 'AI_HANDLED', label: '⚡ AI' },
              { id: 'RESOLVED', label: '✓ DONE' },
            ].map((st) => (
              <button
                key={st.id}
                id={`filter-status-${st.id}`}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2 py-1 text-[10px] font-mono-retro font-bold border-2 border-[#1A1A1A] cursor-pointer whitespace-nowrap ${
                  statusFilter === st.id
                    ? 'bg-[#E09A25] text-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]'
                    : 'bg-[#FAF3E0] text-[#1A1A1A] hover:bg-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thread List Feed */}
        <div className="flex-1 overflow-y-auto divide-y-2 divide-[#1A1A1A]/20 bg-[#FAF3E0]/30">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono-retro text-gray-500">
              No conversations matching current filter criteria.
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = thread.id === activeThread?.id;
              const isNeedsHuman = thread.status === 'NEEDS_HUMAN';

              return (
                <div
                  key={thread.id}
                  id={`thread-item-${thread.id}`}
                  onClick={() => onSelectThread(thread.id)}
                  className={`p-3 cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? 'bg-[#FFFDF9] border-l-[#B8251B] shadow-inner font-bold'
                      : isNeedsHuman
                      ? 'bg-red-50/60 hover:bg-[#FFFDF9] border-l-[#B8251B]'
                      : 'hover:bg-[#FFFDF9] border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-mono-retro font-extrabold px-1.5 py-0.2 border border-[#1A1A1A] ${getChannelColor(
                          thread.channel
                        )}`}
                      >
                        {thread.channel.toUpperCase()}
                      </span>
                      <span className="font-serif-vintage font-bold text-xs sm:text-sm text-[#1A2B4C] truncate max-w-[140px]">
                        {thread.senderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono-retro text-gray-500">
                        {thread.lastMessageTime}
                      </span>
                      {isNeedsHuman && (
                        <span className="w-2 h-2 rounded-full bg-[#B8251B] animate-ping" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-mono-retro text-[#1A1A1A]/85 line-clamp-2 leading-relaxed">
                    {thread.lastMessageText}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#1A1A1A]/10 text-[10px] font-mono-retro">
                    <span className="bg-[#FAF3E0] px-1.5 py-0.5 border border-[#1A1A1A]/40 text-[#1A1A1A]/80">
                      {thread.language}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        Conf: {(thread.confidence * 100).toFixed(0)}%
                      </span>
                      <span
                        className={`font-bold px-1.5 py-0.5 border border-[#1A1A1A] ${
                          isNeedsHuman
                            ? 'bg-[#B8251B] text-white'
                            : thread.status === 'AI_HANDLED'
                            ? 'bg-[#E09A25] text-[#1A1A1A]'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {thread.status === 'NEEDS_HUMAN'
                          ? 'NEEDS HUMAN'
                          : thread.status === 'AI_HANDLED'
                          ? 'AI AUTOPILOT'
                          : 'RESOLVED'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Panel */}
      <div className="lg:col-span-7 flex flex-col matchbox-card h-full overflow-hidden">
        {activeThread ? (
          <>
            {/* Active Thread Header */}
            <div className="p-3 bg-[#FAF3E0] border-b-3 border-[#1A1A1A] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A2B4C] border-2 border-[#1A1A1A] text-[#FAF3E0] flex items-center justify-center font-serif-vintage font-bold text-lg shadow-[2px_2px_0_#1A1A1A]">
                  {activeThread.senderName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-vintage font-bold text-base text-[#1A2B4C]">
                      {activeThread.senderName}
                    </h3>
                    <span
                      className={`text-[9px] font-mono-retro font-bold px-1.5 py-0.2 border border-[#1A1A1A] ${getChannelColor(
                        activeThread.channel
                      )}`}
                    >
                      {getChannelIconLabel(activeThread.channel)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono-retro text-gray-700">
                    <span>{activeThread.senderHandle}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-800 font-bold">
                      <Clock className="w-3 h-3" />
                      Meta Window: {activeThread.windowExpiresAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Takeover Toggles */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-toggle-human-mode"
                  onClick={() => {
                    const newMode = !isHumanActive;
                    setHumanTakeoverMode((prev) => ({ ...prev, [activeThread.id]: newMode }));
                    if (newMode) {
                      onUpdateStatus(activeThread.id, 'NEEDS_HUMAN');
                    } else {
                      onUpdateStatus(activeThread.id, 'AI_HANDLED');
                    }
                  }}
                  className={`px-2.5 py-1.5 border-2 border-[#1A1A1A] text-xs font-mono-retro font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isHumanActive
                      ? 'bg-[#B8251B] text-white shadow-[2px_2px_0_#1A1A1A]'
                      : 'bg-[#FAF3E0] hover:bg-white text-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#E09A25]" />
                  {isHumanActive ? 'HUMAN AGENT ACTIVE' : 'SWITCH TO HUMAN'}
                </button>

                <button
                  id="btn-mark-thread-resolved"
                  onClick={() => onUpdateStatus(activeThread.id, 'RESOLVED')}
                  className="px-2.5 py-1.5 bg-[#FAF3E0] hover:bg-emerald-100 text-emerald-900 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] text-xs font-mono-retro font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  RESOLVE
                </button>
              </div>
            </div>

            {/* Meta 24-hr Policy & RAG Confidence Status Strip */}
            <div className="bg-[#FFF8E7] px-3 py-1.5 border-b border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono-retro">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#B8251B]">
                  INTENT: {activeThread.intent || 'GENERAL_QUERY'}
                </span>
                <span>|</span>
                <span>Language: {activeThread.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Confidence:</span>
                <span
                  className={`font-bold px-1 border border-[#1A1A1A] ${
                    activeThread.confidence >= 0.75
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-red-200 text-red-900'
                  }`}
                >
                  {(activeThread.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Conversation Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF3E0]/20">
              {activeThread.messages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                const isAi = msg.sender === 'ai';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono-retro text-gray-600">
                      {isCustomer ? (
                        <span className="font-bold text-[#1A2B4C] flex items-center gap-1">
                          <User className="w-3 h-3 text-[#B8251B]" /> {activeThread.senderName}
                        </span>
                      ) : isAi ? (
                        <span className="font-bold text-[#B8251B] flex items-center gap-1">
                          <Bot className="w-3 h-3 text-[#E09A25]" /> SocialSync RAG Auto-Pilot
                        </span>
                      ) : (
                        <span className="font-bold text-[#1A2B4C] flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-700" /> Store Operator (You)
                        </span>
                      )}
                      <span>• {msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3 border-2 border-[#1A1A1A] text-xs font-mono-retro leading-relaxed ${
                        isCustomer
                          ? 'bg-[#FFFDF9] shadow-[3px_3px_0_#1A1A1A] text-[#1A1A1A]'
                          : isAi
                          ? 'bg-[#FAF3E0] border-[#B8251B] shadow-[3px_3px_0_#1A1A1A] text-[#1A1A1A]'
                          : 'bg-[#E09A25]/20 border-emerald-800 shadow-[3px_3px_0_#1A1A1A] text-[#1A1A1A]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {isAi && msg.confidence && (
                        <div className="mt-2 pt-1.5 border-t border-[#1A1A1A]/20 flex items-center justify-between text-[9px] text-[#1A1A1A]/70">
                          <span className="bg-[#E09A25] text-[#1A1A1A] font-bold px-1 border border-[#1A1A1A]">
                            Confidence: {(msg.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="font-bold text-[#B8251B]">
                            {msg.intent || activeThread.intent}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nepali Quick Replies Chips */}
            <div className="px-3 py-1.5 bg-[#FFFDF9] border-t border-[#1A1A1A] flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-mono-retro font-bold text-[#B8251B] whitespace-nowrap">
                QUICK REPLIES:
              </span>
              {nepaliQuickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(qr)}
                  className="px-2 py-0.5 bg-[#FAF3E0] hover:bg-[#F5EBE0] text-[10px] font-mono-retro border border-[#1A1A1A] whitespace-nowrap text-[#1A1A1A] cursor-pointer"
                >
                  "{qr.slice(0, 32)}..."
                </button>
              ))}
            </div>

            {/* Input Formulation Bar */}
            <form onSubmit={handleSend} className="p-3 bg-[#FAF3E0] border-t-3 border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <input
                  id="input-reply-message"
                  type="text"
                  placeholder={
                    isHumanActive
                      ? 'Type manual operator reply in Nepali, Romanized Nepali, or English...'
                      : 'Type message (will pause AI and send as human operator)...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#FFFDF9] border-2 border-[#1A1A1A] text-xs font-mono-retro focus:outline-none shadow-[2px_2px_0_#1A1A1A]"
                />
                <button
                  id="btn-send-reply"
                  type="submit"
                  className="matchbox-button-primary px-4 py-2 text-xs font-mono-retro font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>SEND</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Flame className="w-12 h-12 text-[#E09A25] mb-2" />
            <h3 className="font-serif-vintage font-bold text-lg text-[#1A2B4C]">
              No Active Conversation Selected
            </h3>
            <p className="text-xs font-mono-retro text-gray-600 mt-1 max-w-sm">
              Select any incoming social message feed from the left panel to inspect RAG response, review confidence metrics, or take over manual messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
