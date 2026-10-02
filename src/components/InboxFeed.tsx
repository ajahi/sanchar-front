import { askAi, customerMessageAgeMs, MEDIA_DRAG_TYPE, replyWindowClosed, type ShopMedia } from '../api';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConversationThread, ChatMessage, ChannelType } from '../types';
import { Skeleton } from './Skeleton';
import { Send, Sparkles, UserCheck, Bot, Clock, Flame } from 'lucide-react';

const box = 'block mt-2 max-h-64 max-w-full border-2 border-black';

// Thumbnail -> full-screen view inside the app. Native <dialog>: top layer (above everything),
// Esc closes it for free; click anywhere closes too. Portaled to <body> because the bubble is a <p>.
const ImageView: React.FC<{ url: string }> = ({ url }) => {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="block cursor-zoom-in">
        <img src={url} alt="Image expired — view in Instagram" className={box} />
      </button>
      {createPortal(
        <dialog
          ref={ref}
          onClick={() => ref.current?.close()}
          className="m-auto bg-transparent p-0 max-w-[95vw] max-h-[95vh] backdrop:bg-black/85 cursor-zoom-out"
        >
          <img src={url} alt="Customer attachment" className="max-w-[95vw] max-h-[95vh] object-contain border-2 border-black" />
        </dialog>,
        document.body
      )}
    </>
  );
};

// Native media elements. Instagram CDN urls expire; a dead image falls back to its alt text.
const Attachment: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const url = msg.mediaUrl;
  if (!url) return msg.text ? null : <span className="italic text-black/50">[Unsupported message — view in Instagram]</span>;
  if (msg.mediaType === 'image') return <ImageView url={url} />;
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
  onSendMessage: (text: string, sender: 'human' | 'ai') => void | Promise<void>;
  onSendMedia: (mediaId: string) => Promise<void>;
  onSimulateInboundCustomerMessage: (threadId: string, text: string) => void;
  confidenceThreshold: number;
  loading: boolean; // conversations or the open thread's messages are still being fetched
}

// Alternating left/right bubbles, like the real messages.
const MessageSkeleton: React.FC = () => (
  <div role="status" aria-label="Loading messages" className="flex flex-col gap-5">
    {['self-start w-[60%]', 'self-end w-[50%]', 'self-start w-[45%]'].map((pos, i) => (
      <div key={i} className={`flex flex-col gap-1 ${pos}`}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-14 w-full border-2 border-black/20" />
      </div>
    ))}
  </div>
);

export const InboxFeed: React.FC<InboxFeedProps> = ({
  loading,
  thread,
  onSendMessage,
  onSendMedia,
  onSimulateInboundCustomerMessage,
  confidenceThreshold,
}) => {
  const [inputText, setInputText] = useState('');
  const [attached, setAttached] = useState<ShopMedia[]>([]); // photos dropped here, sent with the next SEND
  const [dragOver, setDragOver] = useState(false);
  const [dropNote, setDropNote] = useState('');
  const [now, setNow] = useState(() => Date.now()); // ticks so the 24h warning appears while the chat stays open
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const windowClosed = thread ? replyWindowClosed(thread.messages, now) : false;
  const [toastOpen, setToastOpen] = useState(false);
  useEffect(() => {
    // Toast on opening a thread whose reply window has closed; fades after 8s (the composer stays disabled).
    if (!windowClosed) {
      setToastOpen(false);
      return;
    }
    setToastOpen(true);
    const t = setTimeout(() => setToastOpen(false), 8000);
    return () => clearTimeout(t);
  }, [thread?.id, windowClosed]);
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
  const [showSimulateDropdown, setShowSimulateDropdown] = useState(false);
  const [customSimulateText, setCustomSimulateText] = useState('');

  if (!thread) {
    if (loading) {
      return (
        <section className="flex-1 border-r-4 border-black aged-paper p-6">
          <MessageSkeleton />
        </section>
      );
    }
    return (
      <section className="flex-1 flex items-center justify-center border-r-4 border-black aged-paper p-8 text-center">
        <div className="matchbox-border p-8 bg-white max-w-md">
          <div className="w-12 h-12 vermilion-bg text-white border-2 border-black flex items-center justify-center mx-auto mb-3 font-serif font-black text-xl">
            SS
          </div>
          <h2 className="serif-heading text-xl mb-2">No Thread Selected</h2>
          <p className="text-xs text-[#1A1A1A]/70 mb-4 font-mono">
            Select a conversation from the left feed to view the live customer inquiry and omnichannel context.
          </p>
        </div>
      </section>
    );
  }

  const isEscalated = thread.status === 'NEEDS_HUMAN';
  const ageHours = Math.floor((customerMessageAgeMs(thread.messages, now) ?? 0) / 3_600_000);
  const ageLabel = ageHours >= 48 ? `${Math.floor(ageHours / 24)} days` : `${ageHours} hours`;

  const handleSend = async () => {
    const text = inputText.trim();
    const photos = attached;
    if (windowClosed || (!text && photos.length === 0)) return;
    setInputText('');
    setAttached([]);
    setDropNote('');
    if (text) await onSendMessage(text, 'human'); // text first, then the photos, in order
    for (const m of photos) await onSendMedia(m.id);
  };

  const isMediaDrag = (e: React.DragEvent) => e.dataTransfer.types.includes(MEDIA_DRAG_TYPE);

  const handleDrop = (e: React.DragEvent) => {
    if (!isMediaDrag(e)) return;
    e.preventDefault();
    setDragOver(false);
    if (windowClosed) return;
    if (thread.channel !== 'instagram') {
      setDropNote('Sending photos works in Instagram chats only for now.');
      return;
    }
    try {
      const m = JSON.parse(e.dataTransfer.getData(MEDIA_DRAG_TYPE)) as ShopMedia;
      setDropNote('');
      setAttached((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    } catch {
      /* not one of ours */
    }
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
    <section
      className="relative flex-1 flex flex-col border-r-4 border-black aged-paper h-full overflow-hidden select-none"
      onDragOver={(e) => {
        if (!isMediaDrag(e) || windowClosed) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
      }}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-40 bg-[#E09A25]/30 border-4 border-dashed border-[#B8251B] flex items-center justify-center pointer-events-none">
          <span className="bg-white border-2 border-black px-4 py-2 font-mono text-xs font-bold uppercase">
            Drop to attach to your reply
          </span>
        </div>
      )}
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

        <div className="flex items-center gap-2">
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

      <div className="relative flex-1 min-h-0 flex flex-col">
      {/* 24h reply window closed: a toast over the messages (Meta would reject a send; the composer is disabled below) */}
      {windowClosed && toastOpen && (
        <div
          role="alert"
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[min(32rem,calc(100%-2rem))] bg-amber-100 text-[#1A1A1A] px-3 py-2.5 border-2 border-black shadow-[4px_4px_0px_#1A1A1A] flex items-start gap-2"
        >
          <Clock className="w-4 h-4 mt-0.5 text-[#B8251B] shrink-0" />
          <p className="flex-1 text-[11px] font-mono leading-snug">
            <span className="font-bold uppercase">Reply window closed.</span> This customer&apos;s last message was
            over {ageLabel} ago, and {thread.channel === 'whatsapp' ? 'WhatsApp' : thread.channel === 'facebook' ? 'Messenger' : 'Instagram'} only
            allows replies within 24 hours. You can reply again once they message you.
          </p>
          <button
            type="button"
            onClick={() => setToastOpen(false)}
            aria-label="Dismiss"
            className="text-sm leading-none font-bold cursor-pointer px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5 overflow-y-auto">
        {loading && thread.messages.length === 0 && <MessageSkeleton />}
        {thread.messages.map((msg) => {
          if (msg.sender === 'customer') {
            return (
              <div key={msg.id} className="flex flex-col gap-1 max-w-[85%] self-start items-start">
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
                  <span className="text-[9px] font-bold bg-[#1A2B4C] text-white px-1.5 py-0.5 border border-black font-mono">
                    SOURCE: {source}
                  </span>
                  {msg.intent && (
                    <span className="text-[9px] font-bold bg-white text-black px-1.5 py-0.5 border border-black font-mono">
                      INTENT: {msg.intent}
                    </span>
                  )}
                </div>
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
        {(attached.length > 0 || dropNote) && (
          <div className="flex flex-wrap items-center gap-2">
            {attached.map((m) => (
              <div key={m.id} className="relative w-14 h-14 border-2 border-black" title={m.title ?? 'photo'}>
                <img src={m.url} alt={m.title ?? 'photo'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setAttached((prev) => prev.filter((x) => x.id !== m.id))}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#B8251B] text-white text-[10px] leading-none border border-black cursor-pointer"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {dropNote && <span className="text-[10px] font-mono text-[#B8251B]">{dropNote}</span>}
          </div>
        )}
        <div className="flex gap-2">
          <input
            id="operator-message-input"
            type="text"
            placeholder={
              windowClosed
                ? 'Reply window closed: wait for the customer to message again'
                : isEscalated
                ? 'Human operator: type response in Nepali, Nepglish, or English...'
                : 'Send message to customer across ' + thread.channel.toUpperCase() + '...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={windowClosed}
            className="flex-1 border-2 border-black p-2.5 text-xs md:text-sm font-mono bg-[#FAF3E0]/30 focus:outline-none focus:bg-white focus:border-[#B8251B] disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <button
            id="generate-ai-draft-btn"
            onClick={handleGenerateAiDraft}
            disabled={isGeneratingAiDraft || windowClosed}
            className="pill mustard-bg text-black hover:bg-amber-400 cursor-pointer disabled:opacity-50 px-3 hidden sm:flex items-center gap-1.5"
            title="Ask Gemini RAG engine to suggest a draft response"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B8251B]" />
            <span>{isGeneratingAiDraft ? 'THINKING...' : 'AI DRAFT'}</span>
          </button>

          <button
            id="send-operator-message-btn"
            onClick={handleSend}
            disabled={windowClosed || (!inputText.trim() && attached.length === 0)}
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
