import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@petearth/shared', '@petearth/supabase'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
