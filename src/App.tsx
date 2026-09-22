import React, { useEffect, useState } from 'react';
import { 
  ConversationThread, 
  InventoryItem, 
  FAQItem, 
  MetaConnectionStatus, 
  ChannelType, 
  ChatMessage,
  AuthUser,
} from './types';
import { askAi, getMyTenant, listConversations, listMessages, logout, sendReply } from './api';
import { initialInventory, initialFAQs, initialMetaStatus } from './mockData';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { InboxFeed } from './components/InboxFeed';
import { RightInspector } from './components/RightInspector';
import { RAGSandboxModal } from './components/RAGSandboxModal';
import { MetaSettingsModal } from './components/MetaSettingsModal';
import { InventoryModal } from './components/InventoryModal';
import { InboundSimulatorModal } from './components/InboundSimulatorModal';
import { Footer } from './components/Footer';

export default function App() {
  // Application State
  const [businessName, setBusinessName] = useState('Himalayan Silk & Handicrafts (काठमाडौँ)');
  const [defaultLanguage, setDefaultLanguage] = useState<'nepali' | 'nepglish' | 'english'>('nepglish');
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [faqs, setFaqs] = useState<FAQItem[]>(initialFAQs);
  const [metaStatus, setMetaStatus] = useState<MetaConnectionStatus>(initialMetaStatus);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.75);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'inbox' | 'sandbox' | 'inventory' | 'settings'>('inbox');
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);

  // Filters
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<'all' | ChannelType>('all');
  const [filterNeedsHumanOnly, setFilterNeedsHumanOnly] = useState(false);

  const handleSignOut = async () => {
    await logout();
    window.location.assign('/login');
  };

  // Who am I (the session cookie is httpOnly; the backend resolves it).
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    getMyTenant()
      .then((t) => {
        setBusinessName(t.name);
        setCurrentUser({ id: t.id, email: '', businessName: t.name, ownerName: t.owner_name ?? t.name });
      })
      // Clear the cookie too, or middleware bounces /login straight back here (reload loop).
      .catch(handleSignOut);
  }, []);

  // Real inbox: conversations from the backend (fed by the Instagram webhook).
  // ponytail: 5s polling; swap for SSE/websocket when it matters. Loaded messages are kept
  // across polls so the open thread does not flicker.
  useEffect(() => {
    let alive = true;
    const load = () =>
      listConversations()
        .then((fresh) => {
          if (!alive) return;
          setThreads((prev) =>
            fresh.map((t) => ({ ...t, messages: prev.find((p) => p.id === t.id)?.messages ?? [] }))
          );
          setActiveThreadId((id) => id || fresh[0]?.id || '');
        })
        .catch(console.error);
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Messages for the open thread (refetched on each poll tick via last_message_at change).
  const activeThreadLastSeen = threads.find((t) => t.id === activeThreadId)?.lastMessageAt;
  useEffect(() => {
    if (!activeThreadId) return;
    listMessages(activeThreadId)
      .then((messages) =>
        setThreads((prev) => prev.map((t) => (t.id === activeThreadId ? { ...t, messages } : t)))
      )
      .catch(console.error);
  }, [activeThreadId, activeThreadLastSeen]);

  // Latency and token stats
  const [tokenUsage, setTokenUsage] = useState(412);
  const [latencyMs, setLatencyMs] = useState(120);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0] || null;
  const unresolvedEscalationsCount = threads.filter((t) => t.status === 'NEEDS_HUMAN').length;

  // Handler for Header tab clicks
  const handleTabChange = (tab: 'inbox' | 'sandbox' | 'inventory' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'sandbox') setIsSandboxOpen(true);
    else if (tab === 'inventory') setIsInventoryOpen(true);
    else if (tab === 'settings') setIsSettingsOpen(true);
  };

  // Toggle Human takeover vs Auto-pilot
  const handleToggleTakeover = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          const nextStatus = t.status === 'NEEDS_HUMAN' ? 'AUTO_PILOT' : 'NEEDS_HUMAN';
          return {
            ...t,
            status: nextStatus,
            escalationReason:
              nextStatus === 'NEEDS_HUMAN'
                ? 'Manual operator takeover initiated by merchant'
                : undefined,
          };
        }
        return t;
      })
    );
  };

  // Human operator sending message to active thread
  const handleSendMessage = async (text: string, sender: 'human' | 'ai') => {
    if (!activeThread) return;

    if (sender === 'human') {
      // Real send: backend posts the DM to Instagram and returns the stored message.
      try {
        const sent = await sendReply(activeThread.id, text);
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id ? { ...t, messages: [...t.messages, sent], lastSeen: 'Just now' } : t
          )
        );
      } catch (err) {
        alert(`Send failed: ${(err as Error).message}`);
      }
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            messages: [...t.messages, newMsg],
            lastSeen: 'Just now',
          };
        }
        return t;
      })
    );
  };

  // Simulate customer inbound message in current thread
  const handleSimulateInboundCustomerMessage = async (threadId: string, customerText: string) => {
    const targetThread = threads.find((t) => t.id === threadId);
    if (!targetThread) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const customerMsg: ChatMessage = {
      id: `msg-c-${Date.now()}`,
      sender: 'customer',
      text: customerText,
      timestamp: timeNow,
    };

    // Append customer message immediately
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            messages: [...t.messages, customerMsg],
            lastSeen: 'Just now',
          };
        }
        return t;
      })
    );

    // Run Context-Aware RAG API
    const startTime = performance.now();
    try {
      const ragData = await askAi({ query: customerText, channel: targetThread.channel, confidenceThreshold });
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed > 0 ? elapsed : 110);
      setTokenUsage((prev) => prev + Math.floor(customerText.length / 3) + 45);

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: ragData.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: ragData.confidence,
        source: ragData.sources?.[0] || 'CATALOG_V2.PDF',
        intent: ragData.intent,
        needsHumanAlert: ragData.needsHuman,
      };

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === threadId) {
            return {
              ...t,
              status: ragData.needsHuman ? 'NEEDS_HUMAN' : 'AUTO_PILOT',
              detectedIntent: ragData.intent,
              confidenceScore: ragData.confidence,
              ragSourceDoc: ragData.sources?.[0] || t.ragSourceDoc,
              escalationReason: ragData.needsHuman ? ragData.humanReason : undefined,
              extractedEntities:
                ragData.entities && ragData.entities.length > 0
                  ? ragData.entities
                  : t.extractedEntities,
              messages: [...t.messages, aiMsg],
            };
          }
          return t;
        })
      );
    } catch (err) {
      console.error('Inbound RAG simulation error:', err);
    }
  };

  // Ingest brand new inbound webhook
  const handleTriggerInboundWebhook = async (payload: {
    channel: ChannelType;
    customerName: string;
    customerHandle: string;
    customerCity: string;
    messageText: string;
  }) => {
    const newThreadId = `thread-${Date.now()}`;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newThread: ConversationThread = {
      id: newThreadId,
      channel: payload.channel,
      customerName: payload.customerName,
      customerHandle: payload.customerHandle,
      customerCity: payload.customerCity,
      lastSeen: 'Just now',
      status: 'AUTO_PILOT',
      unreadCount: 1,
      detectedIntent: 'Inbound Customer Inquiry',
      confidenceScore: 0.90,
      ragSourceDoc: 'CATALOG_V2.PDF',
      extractedEntities: [{ type: 'City', value: payload.customerCity }],
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: 'customer',
          text: payload.messageText,
          timestamp: timeNow,
        },
      ],
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThreadId);

    // Call RAG for automated response
    try {
      const ragData = await askAi({ query: payload.messageText, channel: payload.channel, confidenceThreshold });

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: ragData.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: ragData.confidence,
        source: ragData.sources?.[0] || 'CATALOG_V2.PDF',
        intent: ragData.intent,
        needsHumanAlert: ragData.needsHuman,
      };

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === newThreadId) {
            return {
              ...t,
              status: ragData.needsHuman ? 'NEEDS_HUMAN' : 'AUTO_PILOT',
              detectedIntent: ragData.intent,
              confidenceScore: ragData.confidence,
              ragSourceDoc: ragData.sources?.[0] || 'CATALOG_V2.PDF',
              escalationReason: ragData.needsHuman ? ragData.humanReason : undefined,
              extractedEntities: ragData.entities || [],
              messages: [...t.messages, aiMsg],
            };
          }
          return t;
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Inventory handlers
  const handleAddProduct = (item: InventoryItem) => {
    setInventory((prev) => [item, ...prev]);
  };

  const handleDeleteProduct = (id: string) => {
    setInventory((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddFAQ = (faq: FAQItem) => {
    setFaqs((prev) => [...prev, faq]);
  };

  return (
    <div
      id="app-root-container"
      className="flex flex-col h-screen w-full overflow-hidden select-none"
      style={{
        backgroundColor: '#F5EBE0',
        fontFamily: '"Space Mono", "Courier New", Courier, monospace',
        color: '#1A1A1A',
      }}
    >
      {/* Top Vintage Matchbox Header */}
      <Header
        businessName={businessName}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        metaStatus={metaStatus}
        confidenceThreshold={confidenceThreshold}
        unresolvedEscalationsCount={unresolvedEscalationsCount}
        onOpenNewInboundModal={() => setIsInboundModalOpen(true)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main 12-Column High Density Workspace */}
      <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden min-h-0">
        {/* Left Column: Feeds & Navigation */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-2 overflow-hidden h-full">
          <SidebarNav
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={(id) => setActiveThreadId(id)}
            selectedChannelFilter={selectedChannelFilter}
            onChangeChannelFilter={(filter) => setSelectedChannelFilter(filter)}
            filterNeedsHumanOnly={filterNeedsHumanOnly}
            onToggleNeedsHumanFilter={() => setFilterNeedsHumanOnly(!filterNeedsHumanOnly)}
            confidenceThreshold={confidenceThreshold}
            onChangeConfidenceThreshold={(val) => setConfidenceThreshold(val)}
          />
        </div>

        {/* Center Column: Omnichannel Live Feed & Operator Controls */}
        <div className="col-span-12 md:col-span-8 lg:col-span-6 xl:col-span-7 overflow-hidden h-full">
          <InboxFeed
            thread={activeThread}
            onSendMessage={handleSendMessage}
            onToggleTakeover={handleToggleTakeover}
            onSimulateInboundCustomerMessage={handleSimulateInboundCustomerMessage}
            confidenceThreshold={confidenceThreshold}
          />
        </div>

        {/* Right Column: Live Context & Store Catalog Inspector */}
        <div className="hidden lg:block lg:col-span-3 xl:col-span-3 overflow-hidden h-full">
          <RightInspector
            activeThread={activeThread}
            inventory={inventory}
            defaultLanguage={defaultLanguage}
            onChangeLanguage={(lang) => setDefaultLanguage(lang)}
            onOpenSandbox={() => setIsSandboxOpen(true)}
            onOpenCatalog={() => setIsInventoryOpen(true)}
          />
        </div>
      </main>

      {/* High Density Status Footer */}
      <Footer latencyMs={latencyMs} tokenUsage={tokenUsage} />

      {/* Modals */}
      <RAGSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => {
          setIsSandboxOpen(false);
          setActiveTab('inbox');
        }}
        confidenceThreshold={confidenceThreshold}
      />

      <MetaSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setActiveTab('inbox');
        }}
        metaStatus={metaStatus}
        businessName={businessName}
        onUpdateBusinessName={(name) => setBusinessName(name)}
        defaultLanguage={defaultLanguage}
        onChangeLanguage={(lang) => setDefaultLanguage(lang)}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          setActiveTab('inbox');
        }}
        inventory={inventory}
        faqs={faqs}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddFAQ={handleAddFAQ}
      />

      <InboundSimulatorModal
        isOpen={isInboundModalOpen}
        onClose={() => setIsInboundModalOpen(false)}
        onTriggerInbound={handleTriggerInboundWebhook}
      />
    </div>
  );
}
