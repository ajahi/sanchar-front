export type PlatformChannel = 'facebook' | 'instagram' | 'whatsapp';
export type ChannelType = PlatformChannel;

export type MessageStatus = 'AI_HANDLED' | 'AUTO_PILOT' | 'NEEDS_HUMAN' | 'RESOLVED';
export type ThreadStatus = MessageStatus;

export type LanguageCode = 'ne_roman' | 'ne_devanagari' | 'en' | 'Romanized Nepali' | 'Nepali' | 'English' | string;

export interface AuthUser {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  phone?: string;
  city?: string;
  primaryChannel?: PlatformChannel | 'all';
  role?: 'MERCHANT_ADMIN' | 'SUPPORT_AGENT';
  avatarInitials?: string;
  loginTimestamp?: string;
}

export interface MerchantSettings {
  businessName: string;
  email: string;
  defaultLanguage: LanguageCode;
  confidenceThreshold: number;
  autoPilotEnabled: boolean;
  operatingHours: string;
  currency: string;
  smsAlertPhone: string;
  audioAlerts: boolean;
  metaAppId: string;
  googleAuthConnected: boolean;
}

export interface ChannelConnection {
  channel: PlatformChannel;
  title: string;
  connected: boolean;
  accountName: string;
  accountId: string;
  webhookUrl: string;
  verifyToken: string;
  lastSync: string;
  qualityRating: 'HIGH' | 'MEDIUM' | 'LOW';
  phoneNumber?: string;
  phoneNumberId?: string;
  wabaId?: string;
}

export interface InventoryItem {
  id: string;
  sku?: string;
  name: string;
  nepaliName?: string;
  category: string;
  price?: number;
  priceNpr?: number;
  stock: number;
  description: string;
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
}

export interface StoreFAQ {
  id: string;
  question: string;
  answer?: string;
  answerEn?: string;
  answerNepglish?: string;
  category: string;
  keywords?: string[];
}

export type FAQItem = StoreFAQ;

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'ai' | 'human';
  text: string;
  timestamp: string;
  confidence?: number;
  source?: string;
  intent?: string;
  needsHumanAlert?: boolean;
}

export interface ConversationThread {
  id: string;
  channel: PlatformChannel;
  customerName?: string;
  senderName?: string;
  customerHandle?: string;
  senderHandle?: string;
  customerCity?: string;
  senderId?: string;
  language?: LanguageCode;
  lastSeen?: string;
  lastMessageTime?: string;
  lastMessageText?: string;
  status: ThreadStatus;
  unreadCount?: number;
  unread?: boolean;
  detectedIntent?: string;
  intent?: string;
  confidenceScore?: number;
  confidence?: number;
  ragSourceDoc?: string;
  retrievedDocs?: string[];
  windowExpiresAt?: string;
  extractedEntities?: Array<{ type: string; value: string }>;
  messages: ChatMessage[];
  escalationReason?: string;
}

export interface MetaConnectionStatus {
  facebook: {
    connected: boolean;
    pageName: string;
    pageId: string;
    webhookActive: boolean;
  };
  instagram: {
    connected: boolean;
    handle: string;
    accountId: string;
    directMessagingActive: boolean;
  };
  whatsapp: {
    connected: boolean;
    phoneNumber: string;
    wabaId: string;
    phoneNumberId: string;
  };
}

export interface RAGQueryResult {
  query: string;
  answer: string;
  confidence: number;
  intent: string;
  needsHuman: boolean;
  humanReason?: string | null;
  entities: Array<{ type: string; value: string }>;
  sources: string[];
}

export type RAGSimulationResult = RAGQueryResult;
