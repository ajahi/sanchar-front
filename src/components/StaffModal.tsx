'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { addStaff, listStaff, setStaffStatus, type Staff } from '../api';
import { Modal } from './Modal';

const field = 'w-full p-2 border-2 border-black bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#B8251B]';

// Owner/admin adds teammates who sign in with email + password. Agents only get the inbox.
export function StaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' as 'admin' | 'agent' });
  const [error, setError] = useState<string | null>(null);

  const load = () => listStaff().then(setStaff).catch((e) => setError(e.message));
  useEffect(() => {
    if (open) load();
  }, [open]);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await addStaff(form);
      setForm({ name: '', email: '', password: '', role: 'agent' });
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Staff" icon={Users} size="lg">
      <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
        {error && <p role="alert" className="font-bold text-[#B8251B]">{error}</p>}

        <section className="matchbox-border bg-white p-3 space-y-1">
          {staff.map((s) => {
            const owner = s.roles.includes('owner');
            return (
              <div key={s.id} className="flex items-center justify-between gap-2 py-1">
                <div className="min-w-0">
                  <p className="font-bold truncate">{s.name} <span className="font-normal text-stone-600">· {s.roles.join(', ')}</span></p>
                  <p className="text-[10px] text-stone-600 truncate">{s.email}</p>
                </div>
                {!owner && (
                  <button
                    className="pill aged-paper text-black cursor-pointer shrink-0"
                    onClick={() => run(() => setStaffStatus(s.id, s.status === 'active' ? 'inactive' : 'active'))}
                  >
                    {s.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                )}
              </div>
            );
          })}
        </section>

        <form onSubmit={add} className="matchbox-border bg-white p-3 grid gap-2 sm:grid-cols-2">
          <h3 className="sm:col-span-2 font-black uppercase tracking-widest">Add a teammate</h3>
          <input required placeholder="Name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email (their login)" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required minLength={8} type="password" placeholder="Password (min 8)" className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'agent' })}>
            <option value="agent">Agent — inbox only</option>
            <option value="admin">Admin — also shop info, channels, staff</option>
          </select>
          <button className="pill mustard-bg text-black cursor-pointer sm:col-span-2 justify-center">Add</button>
        </form>
      </div>
    </Modal>
  );
}
