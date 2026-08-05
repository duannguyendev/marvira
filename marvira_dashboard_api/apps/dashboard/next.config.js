/** @type {import('next').NextConfig} */
const {
  resolvePublicApiUrl,
} = require('../../packages/shared-utils/resolve-public-api-url.cjs');

const apiUrl = resolvePublicApiUrl();

const nextConfig = {
  transpilePackages: ['@marvira/shared-types', '@marvira/shared-utils'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001' },
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
