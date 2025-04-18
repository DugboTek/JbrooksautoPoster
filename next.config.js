/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
}

module.exports = nextConfig
