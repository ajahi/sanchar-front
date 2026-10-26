'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { listLeads, setLeadStatus, type Lead, type LeadStatus } from '../api';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';

const primary = 'matchbox-button-primary px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const secondary = 'matchbox-button-secondary px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const TABS: { status?: LeadStatus; label: string }[] = [
  { status: 'new', label: 'TO CONFIRM' },
  { status: 'confirmed', label: 'CONFIRMED' },
  { status: 'cancelled', label: 'CANCELLED' },
  { label: 'ALL' },
];
const when = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// The orders the bot collected in chats (name, phone, address, items), plus customers who only left a number.
// Staff call each one, typically at the end of the day, and mark it confirmed or cancelled.
export function OrdersModal({
  open,
  onClose,
  onOpenChat,
}: {
  open: boolean;
  onClose: () => void;
  onOpenChat: (conversationId: string) => void;
}) {
  const [tab, setTab] = useState(0);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLeads(null);
    setError(null);
    listLeads(TABS[tab].status).then(setLeads).catch((e) => setError(e.message));
  }, [open, tab]);

  const move = async (lead: Lead, status: LeadStatus) => {
    setBusy(lead.id);
    setError(null);
    try {
      const saved = await setLeadStatus(lead.id, status);
      // Leaves the tab it no longer belongs to; on ALL it stays with its new status.
      setLeads((ls) => ls && (TABS[tab].status ? ls.filter((l) => l.id !== lead.id) : ls.map((l) => (l.id === lead.id ? saved : l))));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Orders" icon={ClipboardList} size="xl">
      <div className="p-4 overflow-y-auto space-y-3 text-sm">
        <p className="text-xs text-[#6B5D4F]">
          When a customer wants to buy or book, the bot asks for their name, phone, address and order. Call them, then mark the order.
        </p>
        <div role="tablist" className="flex flex-wrap gap-1.5">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={`pill cursor-pointer ${tab === i ? 'mustard-bg text-black' : 'aged-paper text-black opacity-80 hover:opacity-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-900">{error}</div>}
        {!leads && !error && <Skeleton className="h-24 w-full" />}
        {leads?.length === 0 && <p className="py-6 text-center text-xs text-[#6B5D4F]">Nothing here.</p>}

        <ul className="space-y-2">
          {leads?.map((l) => (
            <li key={l.id} className="matchbox-border bg-white p-3 space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-bold">
                  {l.order?.name ?? l.customer_name ?? 'Customer'}
                  {l.order && l.customer_name && l.customer_name !== l.order.name && (
                    <span className="font-normal text-xs text-[#6B5D4F]"> · {l.customer_name}</span>
                  )}
                </p>
                <p className="text-[10px] font-mono uppercase text-[#6B5D4F]">
                  {l.channel} · {when(l.updated_at)} · {l.status}
                </p>
              </div>
              <a href={`tel:${l.phone}`} className="font-mono font-bold text-[#1A2B4C] underline select-text">{l.phone}</a>
              {l.order ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs select-text">
                  <dt className="font-semibold text-[#6B5D4F]">Order</dt>
                  <dd className="font-semibold break-words">{l.order.items}</dd>
                  <dt className="font-semibold text-[#6B5D4F]">Address</dt>
                  <dd className="break-words">{l.order.address}</dd>
                </dl>
              ) : (
                <p className="text-xs text-[#6B5D4F]">Shared a number, no order details yet.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {l.status !== 'confirmed' && (
                  <button className={primary} disabled={busy === l.id} onClick={() => move(l, 'confirmed')}>CONFIRM</button>
                )}
                {l.status !== 'cancelled' && (
                  <button className={secondary} disabled={busy === l.id} onClick={() => move(l, 'cancelled')}>CANCEL</button>
                )}
                {l.status !== 'new' && (
                  <button className={secondary} disabled={busy === l.id} onClick={() => move(l, 'new')}>BACK TO CONFIRM</button>
                )}
                {l.conversation_id && (
                  <button className={secondary} onClick={() => onOpenChat(l.conversation_id!)}>OPEN CHAT</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
