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

// One row per day (Nepal dates), all tenants: GET /api/v1/admin/activity
type Day = { day: string; conversations: number; messages: number; ai_replies: number; total_conversations: number; total_messages: number };
const getActivity = (days: number): Promise<Day[]> =>
  fetch(`/api/v1/admin/activity?days=${days}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load activity'))));

const ACCENT = '#B8251B';

// One series per chart (no shared axis); hovering a day shows its value in the big number.
function Chart({ title, days, value, bars }: { title: string; days: Day[]; value: (d: Day) => number; bars?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!days.length) return null;
  const W = 600, H = 140, n = days.length;
  const vals = days.map(value);
  const max = Math.max(1, ...vals);
  const bw = W / n;
  const x = (i: number) => (bars ? i * bw + bw / 2 : n < 2 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / max) * (H - 6);
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('');
  const shown = hover ?? n - 1;
  const gap = bw > 4 ? 1 : 0;
  return (
    <div className="matchbox-border bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-stone-600">{title}</p>
        <p className="text-[10px] text-stone-600 tabular-nums">{days[shown].day}</p>
      </div>
      <p className="text-2xl font-black tabular-nums">{vals[shown].toLocaleString()}</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-32 mt-2 cursor-crosshair"
        role="img"
        aria-label={`${title}: ${vals[n - 1]} on ${days[n - 1].day}, from ${vals[0]} on ${days[0].day}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const f = (e.clientX - r.left) / r.width;
          setHover(Math.min(n - 1, Math.max(0, bars ? Math.floor(f * n) : Math.round(f * (n - 1)))));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <line x1={0} x2={W} y1={H} y2={H} stroke="#a8a29e" vectorEffect="non-scaling-stroke" />
        {bars ? (
          vals.map((v, i) => (
            <rect key={i} x={i * bw + gap} y={y(v)} width={Math.max(bw - gap * 2, 0.5)} height={H - y(v)} fill={i === hover ? ACCENT : '#292524'} />
          ))
        ) : (
          <>
            <path d={`${line}L${x(n - 1)},${H}L${x(0)},${H}Z`} fill={ACCENT} fillOpacity={0.08} />
            <path d={line} fill="none" stroke={ACCENT} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </>
        )}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="#78716c" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-stone-600 tabular-nums">
        <span>{days[0].day}</span>
        <span>{days[n - 1].day}</span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<AdminTenant[] | null>(null);
  const [activity, setActivity] = useState<Day[]>([]);
  const [range, setRange] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = () => adminListTenants().then(setTenants).catch((e) => setError(e.message));

  useEffect(() => {
    getMe()
      .then((me) => (me.roles.includes('super_admin') ? load() : window.location.replace('/')))
      .catch(() => window.location.replace('/login'));
  }, []);

  useEffect(() => {
    if (tenants) getActivity(range).then(setActivity).catch((e) => setError(e.message));
  }, [range, tenants !== null]); // once the tenant list (and so the super-admin check) is in, and on each range change

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

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] uppercase tracking-widest text-stone-600 mr-1">Growth</p>
          {[30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              aria-pressed={range === d}
              className={`pill cursor-pointer ${range === d ? 'bg-black text-white' : 'aged-paper text-black'}`}
            >
              {d === 365 ? '1 year' : `${d} days`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Chart title="Conversations collected (total)" days={activity} value={(d) => d.total_conversations} />
          <Chart title="Messages collected (total)" days={activity} value={(d) => d.total_messages} />
          <Chart title="Messages per day" days={activity} value={(d) => d.messages} bars />
        </div>
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
