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
}

export default nextConfig
