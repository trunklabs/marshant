import type { NextConfig } from 'next';

const output = process.env.NEXT_OUTPUT_MODE === 'standalone' ? 'standalone' : undefined;

const nextConfig: NextConfig = {
  ...(output ? { output } : {}),
};

export default nextConfig;
