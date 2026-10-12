'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

const PRESETS = {
  light: { bg: '#ffffff', surface: '#ffffff', text: '#111827', border: '#d1d5db' },
  dark: { bg: '#111827', surface: '#1f2937', text: '#f3f4f6', border: '#4b5563' },
  sepia: { bg: '#f6f0e4', surface: '#fbf7ef', text: '#3b2f22', border: '#cdbfa6' },
};
const FONTS = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
};

const DEFAULTS = { preset: 'light', accent: '#2563eb', font: 'sans', size: 15, radius: 6 };
type Theme = typeof DEFAULTS;
const KEY = 'ns_theme';

export function ThemeScope({ children }: { children: ReactNode }) {
  const [t, setT] = useState<Theme>(DEFAULTS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setT({ ...DEFAULTS, ...JSON.parse(s) });
    } catch {}
  }, []);

  const set = (patch: Partial<Theme>) => {
    const next = { ...t, ...patch };
    setT(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const p = PRESETS[t.preset as keyof typeof PRESETS] ?? PRESETS.light;
  const vars = {
    '--t-bg': p.bg,
    '--t-surface': p.surface,
    '--t-text': p.text,
    '--t-border': p.border,
    '--t-accent': t.accent,
    '--t-font': FONTS[t.font as keyof typeof FONTS] ?? FONTS.sans,
    '--t-size': `${t.size}px`,
    '--t-radius': `${t.radius}px`,
  } as CSSProperties;

  const row = 'flex items-center justify-between gap-3 text-sm';
  return (
    <div className="theme-clean" style={vars}>
      {children}
      <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 2147483647 }}>
        {open && (
          <div
            className="mb-2 w-64 space-y-3 p-3"
            style={{ background: p.surface, color: p.text, border: `1px solid ${p.border}`, borderRadius: t.radius, fontFamily: 'var(--t-font)' }}
          >
            <label className={row}>
              Preset
              <select value={t.preset} onChange={(e) => set({ preset: e.target.value })} style={{ background: p.bg, color: p.text }}>
                {Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            <label className={row}>
              Accent
              <input type="color" value={t.accent} onChange={(e) => set({ accent: e.target.value })} />
            </label>
            <label className={row}>
              Font
              <select value={t.font} onChange={(e) => set({ font: e.target.value })} style={{ background: p.bg, color: p.text }}>
                {Object.keys(FONTS).map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            <label className={row}>
              Size {t.size}px
              <input type="range" min={12} max={20} value={t.size} onChange={(e) => set({ size: +e.target.value })} />
            </label>
            <label className={row}>
              Radius {t.radius}px
              <input type="range" min={0} max={16} value={t.radius} onChange={(e) => set({ radius: +e.target.value })} />
            </label>
            <button className="text-xs underline" onClick={() => set(DEFAULTS)}>Reset</button>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          style={{ background: t.accent, color: '#fff', borderRadius: t.radius, padding: '6px 12px', fontSize: 13 }}
        >
          Theme
        </button>
      </div>
    </div>
  );
}
