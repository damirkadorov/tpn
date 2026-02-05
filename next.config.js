/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep existing API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
