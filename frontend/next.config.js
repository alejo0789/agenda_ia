/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost', '192.168.1.171', '192.168.1.8'],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    },
    experimental: {
        allowedDevOrigins: ['http://192.168.1.171:3000', 'http://192.168.1.8:3000', 'http://localhost:3000'],
    },
}

module.exports = nextConfig
