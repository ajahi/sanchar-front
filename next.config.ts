import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // The original Vite/esbuild build did not typecheck or lint at build time
  // (types were checked separately via `npm run lint` = tsc --noEmit).
  // Mirror that so pre-existing type gaps don't block the production build.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
