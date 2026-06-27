import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ea.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drop-api.ea.com',
        pathname: '/**',
      },
    ],
  },
  // better-sqlite3 is a native module — must run server-side only
  serverExternalPackages: ['better-sqlite3'],
}

export default nextConfig
