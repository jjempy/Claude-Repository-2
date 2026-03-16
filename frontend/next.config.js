/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' is used for Docker; omit for Vercel (it handles bundling itself)
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
