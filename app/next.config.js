/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using regular img tags for blob images to avoid optimizer timeout in dev
  // If you want to use Next.js Image optimization in production, add remotePatterns
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
