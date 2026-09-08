import React from 'react';
import { AlertTriangle, UserCheck, ArrowRight, X, PhoneCall } from 'lucide-react';
import { ConversationThread } from '../types';

interface EscalationAlertBannerProps {
  thread: ConversationThread;
  onTakeover: (threadId: string) => void;
  onDismiss: (threadId: string) => void;
}

export const EscalationAlertBanner: React.FC<EscalationAlertBannerProps> = ({
  thread,
  onTakeover,
  onDismiss,
}) => {
  return (
    <div className="w-full bg-[#FAF3E0] border-3 border-[#B8251B] shadow-[5px_5px_0_#1A1A1A] p-3 sm:p-4 mb-4 relative overflow-hidden">
      {/* Decorative strike match corner */}
      <div className="absolute top-0 right-0 w-16 h-16 strikepad-edge -mr-8 -mt-8 rotate-45 border border-[#1A1A1A]" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[#B8251B] text-[#FAF3E0] border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-[#E09A25] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#B8251B] text-white text-[10px] font-mono-retro font-bold uppercase px-2 py-0.5 border border-[#1A1A1A]">
                ⚡ HUMAN ESCALATION REQUIRED
              </span>
              <span className="bg-[#E09A25] text-[#1A1A1A] text-[10px] font-mono-retro font-bold uppercase px-2 py-0.5 border border-[#1A1A1A]">
                CHANNEL: {thread.channel.toUpperCase()}
              </span>
              <span className="text-xs font-mono-retro text-red-900 font-bold">
                Confidence: {(thread.confidence * 100).toFixed(0)}% (&lt; 75%)
              </span>
            </div>

            <h3 className="font-serif-vintage font-bold text-sm sm:text-base text-[#1A2B4C] mt-1">
              Customer <span className="underline decoration-[#B8251B] decoration-2">{thread.senderName}</span> ({thread.senderHandle}) is awaiting human operator!
            </h3>

            <p className="text-xs font-mono-retro text-[#1A1A1A]/85 mt-0.5 bg-[#FFFDF9] p-1.5 border border-[#1A1A1A] inline-block">
              <span className="font-bold text-[#B8251B]">Reason:</span> {thread.escalationReason || 'Confidence below defined safety threshold (0.75)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <button
            id={`btn-takeover-${thread.id}`}
            onClick={() => onTakeover(thread.id)}
            className="matchbox-button-primary px-3 py-1.5 text-xs font-mono-retro font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#E09A25]" />
            TAKE OVER CHAT
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            id={`btn-dismiss-${thread.id}`}
            onClick={() => onDismiss(thread.id)}
            className="p-1.5 bg-[#FAF3E0] hover:bg-white text-gray-700 border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] cursor-pointer"
            title="Snooze Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
