import { ConversationThread, InventoryItem, FAQItem, MetaConnectionStatus } from './types';

export const initialInventory: InventoryItem[] = [
  {
    id: 'PROD-01',
    name: 'Handmade Pashmina Shawl (Water Lilly Edition)',
    nepaliName: 'हस्तनिर्मित पश्मिना दोसल्ला',
    category: 'Shawls & Scarves',
    price: 4500,
    stock: 18,
    description: '100% pure Himalayan Chyangra cashmere, woven in Bhaktapur. Color options: Crimson Vermilion, Royal Indigo, Mustard Gold, Natural Ivory.'
  },
  {
    id: 'PROD-02',
    name: 'Heritage Dhaka Topi & Scarf Set',
    nepaliName: 'ढाका टोपी र गलबन्दी सेट',
    category: 'Traditional Wear',
    price: 1800,
    stock: 42,
    description: 'Authentic Palpali Dhaka pattern, pure cotton weave with silk border. Traditional ceremonial wear.'
  },
  {
    id: 'PROD-03',
    name: 'Vintage Brass Singing Bowl (Hand-Hammered)',
    nepaliName: 'काँसको सिङ्गिङ बोल (हस्तनिर्मित)',
    category: 'Spiritual & Decor',
    price: 3200,
    stock: 9,
    description: '7-metal composition tuned to Heart Chakra (F-note), includes rosewood striker and silk ring cushion.'
  },
  {
    id: 'PROD-04',
    name: 'Yak Wool Winter Blanket (Thick Double Layer)',
    nepaliName: 'याकको उनबाट बनेको न्यानो कम्बल',
    category: 'Home & Bedding',
    price: 5500,
    stock: 14,
    description: 'Ultra-warm handspun yak wool blend, dimensions 80x50 inches. Handwoven in Mustang.'
  }
];

export const initialFAQs: FAQItem[] = [
  {
    id: 'FAQ-01',
    question: 'Delivery kata kata huncha ra charge kati ho?',
    answer: 'Kathmandu Valley bhitra same-day/next-day delivery (Rs. 100). Valley bahira Pokhara, Chitwan, Butwal, Biratnagar ma 2-3 din bhitra (Rs. 150).',
    category: 'Shipping'
  },
  {
    id: 'FAQ-02',
    question: 'Cash on Delivery (COD) available cha?',
    answer: 'Yes! COD is available all over Nepal. E-Sewa, Khalti, and Fonepay QR payment pani accept huncha.',
    category: 'Payment'
  },
  {
    id: 'FAQ-03',
    question: 'Discount policy kasto cha?',
    answer: 'Orders above Rs. 5,000 ma 5% flat discount (Code: VINTAGE5). Orders above Rs. 10,000 ma 10% discount. Extra custom discounts require manager approval.',
    category: 'Discount'
  },
  {
    id: 'FAQ-04',
    question: 'Return ra exchange policy k cha?',
    answer: 'Product receive gareko 7 din bhitra defect vaye ma free return or exchange huncha.',
    category: 'Returns'
  }
];

export const initialThreads: ConversationThread[] = [
  {
    id: 'thread-01',
    channel: 'instagram',
    customerName: 'Aayush Sharma',
    customerHandle: '@aayush_np',
    customerCity: 'Pokhara',
    lastSeen: '2m ago',
    status: 'NEEDS_HUMAN',
    unreadCount: 1,
    detectedIntent: 'Escalation / Discount Request',
    confidenceScore: 0.94,
    ragSourceDoc: 'CATALOG_V2.PDF',
    escalationReason: 'Customer requested human manager for custom discount negotiation',
    extractedEntities: [
      { type: 'Location', value: 'Pokhara' },
      { type: 'Product', value: 'Handmade Pashmina Shawl' },
      { type: 'Price', value: 'Rs. 4,500' }
    ],
    messages: [
      {
        id: 'msg-1',
        sender: 'customer',
        text: 'Namaste! Esko price kati ho ani Pokhara ma delivery huncha ki hudaina?',
        timestamp: '10:42 AM'
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: 'Namaste! Yo Handmade Pashmina ko price Rs. 4,500 ho. Pokhara ma delivery 2-3 din bhitra huncha. Delivery charge Rs. 150 ho. Cash on Delivery (COD) pani uplabdha cha!',
        timestamp: '10:42 AM',
        confidence: 0.94,
        source: 'CATALOG_V2.PDF',
        intent: 'PRICE_INQUIRY'
      },
      {
        id: 'msg-3',
        sender: 'customer',
        text: 'Thik cha, malai discount chaiyeko cha. Manager sanga kura garnu cha.',
        timestamp: '10:44 AM'
      },
      {
        id: 'msg-4',
        sender: 'ai',
        text: 'Namaste Aayush ji! Tapai ko special discount anurodh lai hamro customer care manager lai forward gareko chu. Kripaya kehi chhin parkhanuhos, hajur sanga direct kura garnuhunecha.',
        timestamp: '10:44 AM',
        confidence: 0.96,
        source: 'ESCALATION_POLICY',
        intent: 'HUMAN_ESCALATION',
        needsHumanAlert: true
      }
    ]
  },
  {
    id: 'thread-02',
    channel: 'whatsapp',
    customerName: 'Sunita Shrestha',
    customerHandle: '+977-9841234567',
    customerCity: 'Kathmandu',
    lastSeen: '14m ago',
    status: 'AUTO_PILOT',
    unreadCount: 0,
    detectedIntent: 'Product Inquiry & Bulk Order',
    confidenceScore: 0.96,
    ragSourceDoc: 'INVENTORY_TSV',
    extractedEntities: [
      { type: 'Product', value: 'Heritage Dhaka Topi Set' },
      { type: 'Quantity', value: '5 sets' },
      { type: 'Discount Code', value: 'VINTAGE5' }
    ],
    messages: [
      {
        id: 'msg-w1',
        sender: 'customer',
        text: 'Hello, do you have authentic Dhaka Topi for wedding gifts? I need 5 sets.',
        timestamp: '10:28 AM'
      },
      {
        id: 'msg-w2',
        sender: 'ai',
        text: 'Namaste Sunita ji! Yes, we have authentic Palpali Dhaka Topi & Scarf Sets in stock (Rs. 1,800/set). For 5 sets, your total is Rs. 9,000. You qualify for our 5% bulk discount (Code: VINTAGE5), bringing the total to Rs. 8,550 with free Kathmandu delivery today!',
        timestamp: '10:28 AM',
        confidence: 0.96,
        source: 'INVENTORY_TSV',
        intent: 'PRODUCT_AVAILABILITY'
      }
    ]
  },
  {
    id: 'thread-03',
    channel: 'facebook',
    customerName: 'Bikash Thapa',
    customerHandle: 'Bikash Thapa Official',
    customerCity: 'Lalitpur',
    lastSeen: '45m ago',
    status: 'AUTO_PILOT',
    unreadCount: 0,
    detectedIntent: 'Return Policy Inquiry',
    confidenceScore: 0.92,
    ragSourceDoc: 'SHIPPING_POLICY_FAQ',
    extractedEntities: [
      { type: 'Policy', value: '7-Day Return / Exchange' },
      { type: 'Location', value: 'Lalitpur' }
    ],
    messages: [
      {
        id: 'msg-f1',
        sender: 'customer',
        text: 'Esko refund policy kasto cha? 7 days bhitra refund huncha?',
        timestamp: '09:58 AM'
      },
      {
        id: 'msg-f2',
        sender: 'ai',
        text: 'Hajur Bikash ji! Hamro store ma product receive gareko 7 din bhitra defect vaye ma free return or exchange huncha. Unworn ra tag intact huna parcha. Cash refund or exchange dubai garna milcha.',
        timestamp: '09:58 AM',
        confidence: 0.92,
        source: 'SHIPPING_POLICY_FAQ',
        intent: 'GENERAL_FAQ'
      }
    ]
  },
  {
    id: 'thread-04',
    channel: 'instagram',
    customerName: 'Puja Gurung',
    customerHandle: '@puja_g',
    customerCity: 'Butwal',
    lastSeen: '1h ago',
    status: 'NEEDS_HUMAN',
    unreadCount: 2,
    detectedIntent: 'Emergency Express Delivery',
    confidenceScore: 0.68,
    ragSourceDoc: 'SHIPPING_MATRIX',
    escalationReason: 'Confidence 0.68 < 0.75 threshold: Customer requested overnight delivery to Butwal',
    extractedEntities: [
      { type: 'Location', value: 'Butwal' },
      { type: 'Urgency', value: 'Next Day Morning' }
    ],
    messages: [
      {
        id: 'msg-p1',
        sender: 'customer',
        text: 'Kaile samma aaucha Butwal ma? Urgent ho bholi bihana samma chahiyo.',
        timestamp: '09:30 AM'
      },
      {
        id: 'msg-p2',
        sender: 'ai',
        text: 'Namaste Puja ji! Normally Butwal ma standard courier bata 2-3 din lagcha. Bholi bihana emergency express pathauna hamro courier team sanga verify garnu parcha. Hamro store manager le turantai confirm garnuhuncha.',
        timestamp: '09:31 AM',
        confidence: 0.68,
        source: 'SHIPPING_MATRIX',
        intent: 'DELIVERY_CHECK',
        needsHumanAlert: true
      }
    ]
  }
];

export const initialMetaStatus: MetaConnectionStatus = {
  facebook: {
    connected: true,
    pageName: 'Himalayan Silk & Handicrafts',
    pageId: '109827364120938',
    webhookActive: true
  },
  instagram: {
    connected: true,
    handle: '@himalayan_silk_np',
    accountId: '178414002938472',
    directMessagingActive: true
  },
  whatsapp: {
    connected: true,
    phoneNumber: '+977-9801998877',
    wabaId: 'WABA_982348123908',
    phoneNumberId: 'PNID_77889900112'
  }
};
