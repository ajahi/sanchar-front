'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminListTenants, adminSetTenantAi, getMe, logout, type AdminTenant } from '../../src/api';
import { Loader } from '../../src/components/Loader';

const ago = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="matchbox-border bg-white p-3">
      <p className="text-[10px] uppercase tracking-widest text-stone-600">{label}</p>
      <p className="text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<AdminTenant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = () => adminListTenants().then(setTenants).catch((e) => setError(e.message));

  useEffect(() => {
    getMe()
      .then((me) => (me.roles.includes('super_admin') ? load() : window.location.replace('/')))
      .catch(() => window.location.replace('/login'));
  }, []);

  const toggle = async (t: AdminTenant) => {
    if (!t.ai_auto_reply && !t.has_knowledge && !confirm(`${t.name} has no shop info saved. The bot will have nothing to answer from. Turn AI on anyway?`)) return;
    setBusy(t.id);
    setError(null);
    try {
      await adminSetTenantAi(t.id, !t.ai_auto_reply);
      setTenants((all) => all!.map((x) => (x.id === t.id ? { ...x, ai_auto_reply: !t.ai_auto_reply } : x)));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  };

  const rows = useMemo(
    () => (tenants ?? []).filter((t) => `${t.name} ${t.owner_name ?? ''}`.toLowerCase().includes(q.toLowerCase())),
    [tenants, q]
  );
  const sum = (k: 'customers' | 'conversations' | 'open_handovers' | 'messages' | 'ai_replies') =>
    (tenants ?? []).reduce((n, t) => n + t[k], 0);

  if (!tenants) return error ? <p className="p-6 font-bold text-[#B8251B]">{error}</p> : <Loader />;

  return (
    <main className="p-4 md:p-6 space-y-4 font-mono text-xs max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-black uppercase tracking-widest">Sanchar · Super Admin</h1>
        <button
          className="pill aged-paper text-black cursor-pointer"
          onClick={async () => { await logout(); window.location.assign('/login'); }}
        >
          Sign out
        </button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Stat label="Tenants" value={tenants.length} />
        <Stat label="AI on" value={tenants.filter((t) => t.ai_auto_reply).length} />
        <Stat label="Customers" value={sum('customers')} />
        <Stat label="Conversations" value={sum('conversations')} />
        <Stat label="Messages" value={sum('messages')} />
        <Stat label="AI replies" value={sum('ai_replies')} />
        <Stat label="Need a human" value={sum('open_handovers')} />
      </section>

      {error && <p role="alert" className="font-bold text-[#B8251B]">{error}</p>}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tenants…"
        className="w-full md:w-80 p-2 border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-[#B8251B]"
      />

      <div className="matchbox-border bg-white overflow-x-auto">
        <table className="w-full text-left">
          <thead className="uppercase tracking-widest text-[10px] border-b-2 border-black">
            <tr>
              {['Tenant', 'Channels', 'Customers', 'Convos', 'Messages', 'AI replies', 'Need human', 'Last message', 'Shop info', 'AI auto-reply'].map((h) => (
                <th key={h} className="p-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-stone-300">
                <td className="p-2">
                  <p className="font-bold">{t.name}</p>
                  <p className="text-[10px] text-stone-600">{t.owner_name ?? '—'}{t.status !== 'active' && ` · ${t.status}`}</p>
                </td>
                <td className="p-2">{t.channels.join(', ') || '—'}</td>
                <td className="p-2 tabular-nums">{t.customers}</td>
                <td className="p-2 tabular-nums">{t.conversations}</td>
                <td className="p-2 tabular-nums">{t.messages}</td>
                <td className="p-2 tabular-nums">{t.ai_replies}</td>
                <td className="p-2 tabular-nums">{t.open_handovers}</td>
                <td className="p-2 whitespace-nowrap">{ago(t.last_message_at)}</td>
                <td className="p-2">{t.has_knowledge ? 'Yes' : <span className="text-[#B8251B] font-bold">None</span>}</td>
                <td className="p-2">
                  <button
                    onClick={() => toggle(t)}
                    disabled={busy === t.id}
                    aria-pressed={t.ai_auto_reply}
                    className={`pill cursor-pointer disabled:opacity-40 ${t.ai_auto_reply ? 'bg-emerald-800 text-white' : 'aged-paper text-black'}`}
                  >
                    {t.ai_auto_reply ? 'ON' : 'OFF'}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={10} className="p-4 text-center text-stone-600">No tenants found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
