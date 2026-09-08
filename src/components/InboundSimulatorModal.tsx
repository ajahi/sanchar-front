import React, { useState } from 'react';
import { Flame, X, Send, Bot, AlertTriangle } from 'lucide-react';
import { ChannelType } from '../types';

interface InboundSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerInbound: (payload: {
    channel: ChannelType;
    customerName: string;
    customerHandle: string;
    customerCity: string;
    messageText: string;
  }) => void;
}

export const InboundSimulatorModal: React.FC<InboundSimulatorModalProps> = ({
  isOpen,
  onClose,
  onTriggerInbound,
}) => {
  const [channel, setChannel] = useState<ChannelType>('instagram');
  const [customerName, setCustomerName] = useState('Sujan Shrestha');
  const [customerHandle, setCustomerHandle] = useState('@sujan_ktm');
  const [customerCity, setCustomerCity] = useState('Kathmandu');
  const [messageText, setMessageText] = useState('Namaste! Esko price kati ho ani Kathmandu ma delivery kahile huncha?');

  if (!isOpen) return null;

  const quickPresets = [
    {
      title: '🇳🇵 Nepglish Pashmina Price & Kathmandu Delivery',
      channel: 'instagram' as ChannelType,
      name: 'Rohan Adhikari',
      handle: '@rohan_adh',
      city: 'Kathmandu',
      text: 'Namaste! Pashmina shawl ko price kati ho ani Thamel ma delivery aaja huncha?'
    },
    {
      title: '🚨 Manager Discount Escalation (> threshold)',
      channel: 'whatsapp' as ChannelType,
      name: 'Anjali KC',
      handle: '+977-9861002233',
      city: 'Pokhara',
      text: 'Malai 20% discount chaiyeko cha, manager sanga kura garau na please.'
    },
    {
      title: '🇳🇵 Pure Nepali: Dhaka Topi & Gift Sets',
      channel: 'facebook' as ChannelType,
      name: 'Deepak Sharma',
      handle: 'Deepak Sharma NP',
      city: 'Lalitpur',
      text: 'नमस्ते हजुर, ढाका टोपी कति पर्छ? विवाहको लागि ३ वटा चाहिन्छ।'
    },
    {
      title: '⚠️ Emergency Express to Dharan (Low Confidence)',
      channel: 'instagram' as ChannelType,
      name: 'Kripa Rai',
      handle: '@kripa_dharan',
      city: 'Dharan',
      text: 'Urgent ho bholi bihana 8 baje samma Dharan aipugcha? Flight courier garna milcha?'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    onTriggerInbound({
      channel,
      customerName: customerName.trim() || 'Social Shopper',
      customerHandle: customerHandle.trim() || '@customer',
      customerCity: customerCity.trim() || 'Nepal',
      messageText: messageText.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none">
      <div className="matchbox-border bg-[#FAF3E0] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-[8px_8px_0px_#1A1A1A]">
        {/* Header */}
        <div className="vermilion-bg text-white p-3 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-300" />
            <h2 className="serif-heading text-lg tracking-tight">
              Simulate Inbound Meta Webhook
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black text-white border border-white/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs">
          {/* Presets */}
          <div>
            <span className="text-[9px] font-bold text-[#1A1A1A]/70 uppercase">
              QUICK TEST SCENARIOS:
            </span>
            <div className="grid grid-cols-1 gap-1.5 mt-1">
              {quickPresets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChannel(p.channel);
                    setCustomerName(p.name);
                    setCustomerHandle(p.handle);
                    setCustomerCity(p.city);
                    setMessageText(p.text);
                  }}
                  className="text-left p-2 bg-white hover:bg-amber-100 border border-black transition-colors cursor-pointer"
                >
                  <div className="font-bold text-[10px] text-[#B8251B]">{p.title}</div>
                  <div className="text-[10px] text-[#1A1A1A] truncate italic mt-0.5">
                    &ldquo;{p.text}&rdquo;
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="matchbox-border p-3 bg-white space-y-2.5">
            <p className="text-[10px] font-bold text-[#1A2B4C] font-serif uppercase border-b border-black pb-1">
              Inbound Webhook Payload Details
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold uppercase block">Channel Platform:</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as ChannelType)}
                  className="w-full p-1 border border-black bg-[#FAF3E0] font-mono text-xs"
                >
                  <option value="instagram">Instagram Direct</option>
                  <option value="whatsapp">WhatsApp Cloud API</option>
                  <option value="facebook">Facebook Messenger</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase block">Customer City:</label>
                <input
                  type="text"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold uppercase block">Customer Full Name:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase block">Handle / Phone:</label>
                <input
                  type="text"
                  value={customerHandle}
                  onChange={(e) => setCustomerHandle(e.target.value)}
                  className="w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase block">
                Inbound Customer Message (Nepali, Nepglish, English):
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                className="w-full p-2 border-2 border-black bg-[#FAF3E0]/30 font-mono text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full vermilion-bg text-white font-bold py-2 border-2 border-black shadow-[3px_3px_0px_black] hover:bg-[#8F1810] cursor-pointer uppercase text-xs flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Fire Inbound Webhook &amp; Run RAG Router</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t-2 border-black flex justify-between items-center text-[10px] shrink-0">
          <span>Meta Graph Webhook Simulator</span>
          <button
            onClick={onClose}
            className="px-3 py-1 border border-black hover:bg-[#FAF3E0] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
