import type { NextConfig } from 'next';

// /api/v1/* is proxied to the FastAPI backend in middleware.ts (runtime env,
// so one image runs anywhere). Doing it here via rewrites() would bake the URL at build.
const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
