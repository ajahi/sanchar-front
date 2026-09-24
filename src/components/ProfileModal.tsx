'use client';

import { useEffect, useRef, useState } from 'react';
import { Instagram, X } from 'lucide-react';
import { getInstagramProfiles, type InstagramProfile } from '../api';

const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString());

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="border-2 border-black bg-[#FAF3E0] p-2 text-center shadow-[2px_2px_0px_#1A1A1A]">
      <p className="text-base font-black tabular-nums">{fmt(value)}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}

// One connected Instagram professional account (instagram_business_basic fields),
// styled like the Channels modal's cards.
function ProfileCard({ p }: { p: InstagramProfile }) {
  return (
    <div className="matchbox-border p-4 bg-white space-y-4">
      <div className="flex items-center gap-4">
        {p.profile_picture_url ? (
          <img
            src={p.profile_picture_url}
            alt={`${p.username ?? 'Instagram'} profile picture`}
            className="w-20 h-20 rounded-full border-4 border-black object-cover shadow-[3px_3px_0px_#B8251B] shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full border-4 border-black vermilion-bg flex items-center justify-center shadow-[3px_3px_0px_#1A1A1A] shrink-0">
            <Instagram className="w-8 h-8 text-[#FAF3E0]" />
          </div>
        )}
        <div className="min-w-0 space-y-1.5">
          <p className="serif-heading text-lg leading-tight truncate">{p.username ? `@${p.username}` : '—'}</p>
          {p.name && <p className="text-[11px] truncate">{p.name}</p>}
          <div className="flex flex-wrap gap-1.5">
            {p.live ? (
              <span className="pill bg-emerald-800 text-white text-[8px]">● CONNECTED</span>
            ) : (
              <span className="pill bg-[#B8251B] text-white text-[8px]">● SAVED DETAILS</span>
            )}
            {p.account_type && <span className="pill mustard-bg text-black text-[8px]">{p.account_type}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Followers" value={p.followers_count} />
        <Stat label="Following" value={p.follows_count} />
        <Stat label="Posts" value={p.media_count} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase mb-0.5">Instagram ID</p>
          <p className="font-bold break-all">{p.id}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase mb-0.5">Connected</p>
          <p className="font-bold">{new Date(p.connected_at).toLocaleDateString()}</p>
        </div>
      </div>

      {!p.live && (
        <p className="text-[10px] text-[#B8251B] font-bold">
          Instagram didn&apos;t respond — showing saved details. Log in with Instagram again to refresh.
        </p>
      )}
    </div>
  );
}

// Native <dialog>: top layer above everything, Esc closes it; so does a click on the backdrop.
// Profiles are fetched each time it opens, so counts are current.
export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [profiles, setProfiles] = useState<InstagramProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return ref.current?.close();
    ref.current?.showModal();
    setError(null);
    getInstagramProfiles().then(setProfiles).catch((e) => setError(e.message));
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[92vw] max-w-md max-h-[90vh] p-0 matchbox-border bg-[#FAF3E0] text-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] backdrop:bg-black/60 select-text"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Red title bar, as in the Channels modal */}
        <div className="vermilion-bg text-white p-3 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-amber-300" />
            <h2 className="serif-heading text-lg tracking-tight">Instagram Profile</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 hover:bg-black text-white border border-white/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
          {error ? (
            <p className="text-[#B8251B] font-bold">{error}</p>
          ) : !profiles ? (
            <p className="text-stone-600">Loading…</p>
          ) : profiles.length === 0 ? (
            <p className="text-stone-600">No Instagram account connected yet.</p>
          ) : (
            profiles.map((p) => <ProfileCard key={p.id} p={p} />)
          )}
        </div>
      </div>
    </dialog>
  );
}
