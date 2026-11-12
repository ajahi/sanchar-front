'use client';

import { useEffect, useState } from 'react';
import { DoorClosed, DoorOpen } from 'lucide-react';
import { closeShop, getClosure, reopenShop, type Closure } from '../api';
import { Skeleton } from './Skeleton';

const field = 'w-full rounded-lg border border-[#E6D9BF] bg-white px-3 py-2 text-sm focus:border-[#CC3316] focus:outline-none';
const DEFAULT_MESSAGE = 'Hami aaja banda chau. Asuvidha ko lagi maaf garnus.'; // the server's default (hours.DEFAULT_CLOSURE)

const untilText = (c: Closure) =>
  c.until
    ? `until ${new Date(c.until).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    : 'until you reopen';

// The owner's "we are closed" switch. While closed the bot still answers questions, but takes no orders: anyone who
// wants to order gets the message written here (writing "closed today" in a topic is not enough, the bot may not see it).
export function StoreStatusCard() {
  const [status, setStatus] = useState<Closure | null>(null);
  const [message, setMessage] = useState('');
  const [forToday, setForToday] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClosure()
      .then((c) => {
        setStatus(c);
        setMessage(c.custom_message ?? '');
      })
      .catch((e) => setError(e.message));
  }, []);

  const run = async (fn: () => Promise<Closure>) => {
    setError(null);
    setBusy(true);
    try {
      const c = await fn();
      setStatus(c);
      setMessage(c.custom_message ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  if (!status) {
    return error ? (
      <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-900">{error}</p>
    ) : (
      <Skeleton className="h-24 w-full" />
    );
  }

  const text = message.trim() || null;
  const closed = status.closed;
  return (
    <section
      className={`space-y-2 rounded-xl border p-3 ${closed ? 'border-[#CC3316]/50 bg-[#FDECE8]' : 'border-[#E6D9BF] bg-[#FFFBF2]'}`}
      aria-label="Shop open or closed"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-semibold">
            {closed ? <DoorClosed className="h-4 w-4 text-[#B8251B]" /> : <DoorOpen className="h-4 w-4 text-[#11643D]" />}
            {closed ? `Shop is closed ${untilText(status)}` : 'Shop is open'}
          </p>
          <p className="text-xs text-[#6B5D4F]">
            {closed
              ? 'The bot still answers questions, but takes no orders. Anyone who wants to order gets the message below.'
              : 'Closing for the day or a holiday? Switch it here, not in a topic. The bot then takes no orders and replies with your message.'}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${closed ? 'bg-[#CC3316] text-white' : 'bg-[#DDF5E8] text-[#11643D]'}`}>
          {closed ? 'Closed' : 'Open'}
        </span>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-900">{error}</p>}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={DEFAULT_MESSAGE}
        maxLength={500}
        rows={2}
        className={field}
        aria-label="Message the bot sends while closed"
      />

      {closed ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className="matchbox-button-secondary cursor-pointer px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            disabled={busy || text === status.custom_message}
            onClick={() => run(() => closeShop({ message: text, until: status.until }))}
          >
            Update message
          </button>
          <button
            className="matchbox-button-primary cursor-pointer px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            disabled={busy}
            onClick={() => run(reopenShop)}
          >
            {busy ? 'Saving…' : 'Reopen now'}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-3 text-xs" role="radiogroup" aria-label="How long">
            <label className="flex cursor-pointer items-center gap-1">
              <input type="radio" checked={forToday} onChange={() => setForToday(true)} /> Today only (reopens at midnight)
            </label>
            <label className="flex cursor-pointer items-center gap-1">
              <input type="radio" checked={!forToday} onChange={() => setForToday(false)} /> Until I reopen
            </label>
          </div>
          <button
            className="matchbox-button-primary cursor-pointer px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            disabled={busy}
            onClick={() => run(() => closeShop({ message: text, for_today: forToday }))}
          >
            {busy ? 'Saving…' : 'Close shop'}
          </button>
        </div>
      )}
    </section>
  );
}
