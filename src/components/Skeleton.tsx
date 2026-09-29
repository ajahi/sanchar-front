// Placeholder block shown while content loads. Compose these in the shape of the real content.
// Pulses only for people who haven't asked their OS for reduced motion.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`bg-[#1A1A1A]/10 motion-safe:animate-pulse ${className}`} />;
}
