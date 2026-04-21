/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'archive.org',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;