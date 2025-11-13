/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016',
    NEXT_PUBLIC_PREDICTION_STAKING_ADDRESS: process.env.NEXT_PUBLIC_PREDICTION_STAKING_ADDRESS,
  },
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that aren't needed for web
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'pino-pretty': false,
      }
    }
    return config
  },
}

module.exports = nextConfig

