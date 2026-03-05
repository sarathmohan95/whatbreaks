/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // Enable static export for S3/CloudFront
  images: {
    unoptimized: true,  // Required for static export
    domains: [],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com',
  },
}

module.exports = nextConfig
