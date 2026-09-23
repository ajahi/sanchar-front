import { askAi } from '../api';
import React, { useState } from 'react';
import { ConversationThread, ChatMessage, ChannelType } from '../types';
import { 
  Send, 
  Sparkles, 
  UserCheck, 
  Bot, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  CornerDownRight,
  Flame,
  ArrowRight
} from 'lucide-react';

// Native media elements. Instagram CDN urls expire; a dead image falls back to its alt text.
const Attachment: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const url = msg.mediaUrl;
  if (!url) return msg.text ? null : <span className="italic text-black/50">[Unsupported message — view in Instagram]</span>;
  const box = 'block mt-2 max-h-64 max-w-full border-2 border-black';
  if (msg.mediaType === 'image')
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt="Image expired — view in Instagram" className={box} />
      </a>
    );
  if (msg.mediaType === 'video') return <video src={url} controls className={box} />;
  if (msg.mediaType === 'audio') return <audio src={url} controls className="block mt-2 max-w-full" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block mt-2 underline font-bold">
      📎 View {msg.mediaType?.replace('_', ' ') ?? 'attachment'}
    </a>
  );
};

interface InboxFeedProps {
  thread: ConversationThread | null;
  onSendMessage: (text: string, sender: 'human' | 'ai') => void;
  onToggleTakeover: (threadId: string) => void;
  onSimulateInboundCustomerMessage: (threadId: string, text: string) => void;
  confidenceThreshold: number;
}

export const InboxFeed: React.FC<InboxFeedProps> = ({
  thread,
  onSendMessage,
  onToggleTakeover,
  onSimulateInboundCustomerMessage,
  confidenceThreshold,
}) => {
  const [inputText, setInputText] = useState('');
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
  const [showSimulateDropdown, setShowSimulateDropdown] = useState(false);
  const [customSimulateText, setCustomSimulateText] = useState('');

  if (!thread) {
    return (
      <section className="flex-1 flex items-center justify-center border-r-4 border-black aged-paper p-8 text-center">
        <div className="matchbox-border p-8 bg-white max-w-md">
          <div className="w-12 h-12 vermilion-bg text-white border-2 border-black flex items-center justify-center mx-auto mb-3 font-serif font-black text-xl">
            SS
          </div>
          <h2 className="serif-heading text-xl mb-2">No Thread Selected</h2>
          <p className="text-xs text-[#1A1A1A]/70 mb-4 font-mono">
            Select a conversation from the left feed to view the live customer inquiry, AI confidence score, and omnichannel context.
          </p>
        </div>
      </section>
    );
  }

  const isEscalated = thread.status === 'NEEDS_HUMAN';

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'human');
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleGenerateAiDraft = async () => {
    setIsGeneratingAiDraft(true);
    try {
      const lastCustomerMsg = [...thread.messages].reverse().find((m) => m.sender === 'customer');
      const query = lastCustomerMsg ? lastCustomerMsg.text : 'Customer inquiry';
      
      const data = await askAi({ query: query, channel: thread.channel, confidenceThreshold });
      if (data.answer) {
        setInputText(data.answer);
      }
    } catch (e) {
      console.error(e);
      setInputText('Namaste! Hamro store bata hajur ko query review bhairakheko cha. Kripaya kehi samaya parkhanuhos.');
    } finally {
      setIsGeneratingAiDraft(false);
    }
  };

  const cannedResponses = [
    'Namaste! Ma store manager bolirahechu. Hajur lai kasto sahayog garna sakchu?',
    'Hajur ko special request ma 10% discount approve bhayo! Coupon code: VINTAGE10',
    'Hajur, Pokhara ma bholi bihana 11 baje bhitra express delivery arrange gardaichhau.',
    'Hajur ko order dispatch bhyo! Tracking link: courier.np/track/SS98234'
  ];

  const simulationQueries = [
    { label: '🇳🇵 Nepglish: Price & Delivery', text: 'Namaste! Esko price kati ho ani Pokhara ma delivery huncha?' },
    { label: '🚨 Escalation: Ask for Manager', text: 'Thik cha, malai discount chaiyeko cha. Manager sanga kura garnu cha.' },
    { label: '🇳🇵 Pure Nepali: Topi & Cashmere', text: 'नमस्ते, ढाका टोपी कति पर्छ र साइज कस्तो छ?' },
    { label: '💳 Payment / COD Inquiry', text: 'Cash on Delivery uplabdha cha ki E-Sewa matra huncha?' },
    { label: '⚠️ Urgent Express Delivery', text: 'Malai bholi bihana Butwal ma chahiyo, express courier garna milcha?' }
  ];

  return (
    <section className="flex-1 flex flex-col border-r-4 border-black aged-paper h-full overflow-hidden select-none">
      {/* Thread Header Bar */}
      <div className="p-3 border-b-2 border-black flex flex-wrap justify-between items-center bg-white/70 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {thread.channel === 'instagram' && (
            <span className="pill vermilion-bg text-white">INSTAGRAM DM</span>
          )}
          {thread.channel === 'whatsapp' && (
            <span className="pill bg-emerald-700 text-white">WHATSAPP CLOUD API</span>
          )}
          {thread.channel === 'facebook' && (
            <span className="pill bg-[#1A2B4C] text-white">FB MESSENGER</span>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1A1A1A]">{thread.customerName}</span>
              <span className="text-xs text-[#1A1A1A]/60 font-mono">({thread.customerHandle})</span>
            </div>
            {thread.customerCity && (
              <span className="text-[10px] text-[#1A2B4C] font-mono">
                Location: {thread.customerCity} • Meta 24h Window: <span className="text-emerald-700 font-bold">Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Escalation State */}
        <div className="flex items-center gap-2">
          {isEscalated ? (
            <div className="flex items-center gap-1">
              <span className="pill bg-red-800 text-white text-[9px] animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                HUMAN TAKEOVER ACTIVE
              </span>
              <button
                id="resolve-escalation-btn"
                onClick={() => onToggleTakeover(thread.id)}
                className="pill bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer text-[9px]"
              >
                <CheckCircle2 className="w-3 h-3" />
                RESOLVE & RE-ENABLE AI
              </button>
            </div>
          ) : (
            <button
              id="takeover-btn"
              onClick={() => onToggleTakeover(thread.id)}
              className="pill bg-[#1A1A1A] text-white hover:bg-[#B8251B] cursor-pointer text-[9px]"
            >
              <UserCheck className="w-3 h-3" />
              TAKE OVER AS HUMAN
            </button>
          )}

          {/* Quick Simulation Dropdown */}
          <div className="relative">
            <button
              id="simulate-customer-msg-btn"
              onClick={() => setShowSimulateDropdown(!showSimulateDropdown)}
              className="pill mustard-bg text-black hover:bg-amber-400 cursor-pointer text-[9px]"
            >
              <Flame className="w-3 h-3 text-[#B8251B]" />
              SIMULATE CUSTOMER
            </button>

            {showSimulateDropdown && (
              <div className="absolute right-0 mt-1 w-80 bg-white matchbox-border p-2 z-50 shadow-[4px_4px_0px_#1A1A1A] text-left">
                <p className="text-[10px] font-black uppercase text-[#1A2B4C] border-b border-black pb-1 mb-2 font-serif">
                  Inject Inbound Customer Message
                </p>
                <div className="space-y-1.5">
                  {simulationQueries.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSimulateInboundCustomerMessage(thread.id, item.text);
                        setShowSimulateDropdown(false);
                      }}
                      className="w-full text-left p-1.5 text-[11px] font-mono hover:bg-[#FAF3E0] border border-black/20 hover:border-black transition-all"
                    >
                      <div className="font-bold text-[10px] text-[#B8251B]">{item.label}</div>
                      <div className="truncate text-[#1A1A1A] italic">&ldquo;{item.text}&rdquo;</div>
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-black">
                  <input
                    type="text"
                    placeholder="Type custom Nepali / Nepglish query..."
                    value={customSimulateText}
                    onChange={(e) => setCustomSimulateText(e.target.value)}
                    className="w-full p-1 text-xs border border-black font-mono mb-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customSimulateText.trim()) {
                        onSimulateInboundCustomerMessage(thread.id, customSimulateText.trim());
                        setCustomSimulateText('');
                        setShowSimulateDropdown(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (customSimulateText.trim()) {
                        onSimulateInboundCustomerMessage(thread.id, customSimulateText.trim());
                        setCustomSimulateText('');
                        setShowSimulateDropdown(false);
                      }
                    }}
                    className="w-full py-1 text-[10px] font-bold vermilion-bg text-white border border-black uppercase"
                  >
                    Send Inbound Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Escalation Alert Banner */}
      {isEscalated && (
        <div className="bg-[#B8251B] text-white p-2.5 border-b-2 border-black flex items-center justify-between shrink-0 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider font-serif">
                ! ALERT: HUMAN ESCALATION REQUIRED !
              </p>
              <p className="text-[11px] font-mono text-amber-100">
                {thread.escalationReason || 'Customer requested human manager or AI confidence fell below threshold.'}
              </p>
            </div>
          </div>
          <span className="pill bg-white text-black text-[9px] border-black">
            HIGH PRIORITY
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5 overflow-y-auto">
        {thread.messages.map((msg) => {
          if (msg.sender === 'customer') {
            return (
              <div key={msg.id} className="flex flex-col gap-1 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold indigo-text uppercase tracking-wide font-mono">
                    Customer ({thread.channel.toUpperCase()})
                  </span>
                  <span className="text-[9px] text-black/50 font-mono">{msg.timestamp}</span>
                </div>
                <div className="matchbox-border p-3.5 bg-white relative">
                  <p className="text-sm font-mono leading-relaxed text-[#1A1A1A] select-text">
                    {msg.text}
                    <Attachment msg={msg} />
                  </p>
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-black rotate-45 pointer-events-none"></div>
                </div>
              </div>
            );
          }

          if (msg.sender === 'ai') {
            const conf = msg.confidence ?? thread.confidenceScore;
            const source = msg.source ?? thread.ragSourceDoc;

            return (
              <div key={msg.id} className="flex flex-col gap-1 max-w-[85%] self-end items-end">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-black/50 font-mono">{msg.timestamp}</span>
                  <span className="text-[10px] font-bold text-[#8F1810] uppercase tracking-wide font-mono flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    SocialSync AI (RAG-Enabled)
                  </span>
                </div>
                <div className="matchbox-border p-3.5 mustard-bg relative text-left">
                  <p className="text-sm font-mono leading-relaxed text-[#1A1A1A] italic select-text">
                    {msg.text}
                    <Attachment msg={msg} />
                  </p>
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#B8251B] rotate-45 pointer-events-none"></div>
                </div>

                {/* Metadata badges for AI response */}
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  <span className="text-[9px] font-bold bg-green-800 text-white px-1.5 py-0.5 border border-black font-mono">
                    CONFIDENCE: {(conf ?? 0).toFixed(2)}
                  </span>
                  <span className="text-[9px] font-bold bg-[#1A2B4C] text-white px-1.5 py-0.5 border border-black font-mono">
                    SOURCE: {source}
                  </span>
                  {msg.intent && (
                    <span className="text-[9px] font-bold bg-white text-black px-1.5 py-0.5 border border-black font-mono">
                      INTENT: {msg.intent}
                    </span>
                  )}
                </div>

                {msg.needsHumanAlert && (
                  <div className="mt-1 p-1.5 bg-red-800 text-white font-bold text-[10px] uppercase border-2 border-black flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-300" />
                    ! ESCALATED TO HUMAN OPERATOR !
                  </div>
                )}
              </div>
            );
          }

          // Human operator message
          return (
            <div key={msg.id} className="flex flex-col gap-1 max-w-[85%] self-end items-end">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-black/50 font-mono">{msg.timestamp}</span>
                <span className="text-[10px] font-bold text-[#1A2B4C] uppercase tracking-wide font-mono flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-[#B8251B]" />
                  Human Operator (Merchant)
                </span>
              </div>
              <div className="matchbox-border p-3.5 bg-white border-2 border-[#1A1A1A] relative text-left">
                <p className="text-sm font-mono leading-relaxed text-[#1A1A1A] select-text">
                  {msg.text}
                  <Attachment msg={msg} />
                </p>
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#1A2B4C] rotate-45 pointer-events-none"></div>
              </div>
              <span className="text-[9px] font-bold bg-[#B8251B] text-white px-1.5 py-0.5 border border-black font-mono">
                OPERATOR OVERRIDE SENT VIA GRAPH API
              </span>
            </div>
          );
        })}
      </div>

      {/* Canned Quick Responses Bar */}
      <div className="px-4 py-2 border-t-2 border-black bg-[#FAF3E0] flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[9px] font-bold text-[#1A2B4C] uppercase whitespace-nowrap font-serif">
          QUICK REPLIES:
        </span>
        {cannedResponses.map((resText, i) => (
          <button
            key={i}
            onClick={() => setInputText(resText)}
            className="text-[10px] font-mono bg-white hover:bg-amber-100 border border-black px-2 py-1 whitespace-nowrap transition-colors cursor-pointer text-[#1A1A1A]"
          >
            {resText.slice(0, 32)}...
          </button>
        ))}
      </div>

      {/* Bottom Reply Box */}
      <div className="p-3 md:p-4 border-t-4 border-black bg-white flex flex-col gap-2 shrink-0">
        <div className="flex gap-2">
          <input
            id="operator-message-input"
            type="text"
            placeholder={
              isEscalated
                ? 'Human operator: type response in Nepali, Nepglish, or English...'
                : 'Send message to customer across ' + thread.channel.toUpperCase() + '...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-2 border-black p-2.5 text-xs md:text-sm font-mono bg-[#FAF3E0]/30 focus:outline-none focus:bg-white focus:border-[#B8251B]"
          />

          <button
            id="generate-ai-draft-btn"
            onClick={handleGenerateAiDraft}
            disabled={isGeneratingAiDraft}
            className="pill mustard-bg text-black hover:bg-amber-400 cursor-pointer disabled:opacity-50 px-3 hidden sm:flex items-center gap-1.5"
            title="Ask Gemini RAG engine to suggest a draft response"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B8251B]" />
            <span>{isGeneratingAiDraft ? 'THINKING...' : 'AI DRAFT'}</span>
          </button>

          <button
            id="send-operator-message-btn"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="vermilion-bg text-white font-bold px-5 py-2 border-2 border-black shadow-[3px_3px_0px_black] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs uppercase"
          >
            <span>SEND</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-[#1A1A1A]/70">
          <span>Meta Customer Service Window: Active • Encryption: E2E Verified</span>
          <span className="text-[#8F1810] font-bold">
            {isEscalated ? 'Manual Human Mode (Auto-pilot suspended)' : 'Auto-pilot Standby'}
          </span>
        </div>
      </div>
    </section>
  );
};
