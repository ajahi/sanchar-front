// Full-screen preloader: opaque fixed layer, so the whole page looks replaced.
// Spinner colors are inline: theme-clean's border overrides would otherwise flatten them.
export function Loader() {
  return (
    <div role="status" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#FAF3E0]">
      <div className="h-12 w-12 animate-spin rounded-full" style={{ border: '4px solid #E6D9BF', borderTopColor: '#CC3316' }} />
      <p className="text-sm font-semibold">Loading Sanchar…</p>
    </div>
  );
}
