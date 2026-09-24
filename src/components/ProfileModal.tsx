'use client';

import { useEffect, useRef, useState } from 'react';
import { Instagram, X } from 'lucide-react';
import { getInstagramProfiles, type InstagramProfile } from '../api';

const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString());

// One connected Instagram professional account (instagram_business_basic fields).
function ProfileCard({ p }: { p: InstagramProfile }) {
  const rows: [string, string][] = [
    ['Name', p.name ?? '—'],
    ['Instagram ID', p.id],
    ['Account type', p.account_type ?? '—'],
    ['Followers', fmt(p.followers_count)],
    ['Following', fmt(p.follows_count)],
    ['Posts', fmt(p.media_count)],
    ['Connected', new Date(p.connected_at).toLocaleDateString()],
  ];
  return (
    <section className="flex flex-col items-center text-center gap-4">
      {p.profile_picture_url ? (
        <img
          src={p.profile_picture_url}
          alt={`${p.username ?? 'Instagram'} profile picture`}
          className="w-24 h-24 rounded-full border-4 border-black object-cover"
        />
      ) : (
        <div className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center">
          <Instagram className="w-9 h-9 text-[#B8251B]" />
        </div>
      )}
      <p className="text-lg font-black">{p.username ? `@${p.username}` : '—'}</p>
      <div className="w-full text-left">
        {rows.map(([k, v]) => (
          <p key={k} className="flex justify-between gap-6 py-0.5">
            <span className="text-stone-600 shrink-0">{k}</span>
            <span className="font-bold break-all text-right">{v}</span>
          </p>
        ))}
      </div>
      {!p.live && (
        <p className="text-xs text-[#B8251B]">
          Instagram didn&apos;t respond — showing saved details. Log in with Instagram again to refresh.
        </p>
      )}
    </section>
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
      className="m-auto w-[92vw] max-w-md max-h-[90vh] p-0 aged-paper text-[#1A1A1A] font-mono border-4 border-black shadow-[8px_8px_0px_#1A1A1A] backdrop:bg-black/60 select-text"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-serif font-black uppercase">Instagram profile</h2>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error ? (
          <p className="text-[#B8251B]">{error}</p>
        ) : !profiles ? (
          <p className="text-stone-600">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="text-stone-600">No Instagram account connected yet.</p>
        ) : (
          <div className="flex flex-col gap-10">
            {profiles.map((p) => (
              <ProfileCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}
