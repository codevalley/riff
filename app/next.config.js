/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using regular img tags for blob images to avoid optimizer timeout in dev
  // If you want to use Next.js Image optimization in production, add remotePatterns
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Allow embed route to be loaded in iframes on any domain
  async headers() {
    return [
      {
        source: '/embed/:token*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
