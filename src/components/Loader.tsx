// Full-screen preloader: opaque fixed layer, so the whole page looks replaced.
export function Loader() {
  return (
    <div role="status" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#FAF3E0]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-[#B8251B]" />
      <p className="font-mono text-xs font-bold uppercase tracking-widest">Igniting Workstation...</p>
    </div>
  );
}
