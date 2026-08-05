/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@marvira/shared-utils'],
  transpilePackages: ['@marvira/shared-utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost', port: '3001' },
      { protocol: 'https', hostname: 'localhost', port: '3001' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};
module.exports = nextConfig;
