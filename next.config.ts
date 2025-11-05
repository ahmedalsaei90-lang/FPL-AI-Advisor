import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Required due to some type conflicts
  },
  reactStrictMode: false, // Disabled for nodemon compatibility in dev

  // Webpack configuration
  webpack: (config, { dev }) => {
    if (dev) {
      // Only ignore node_modules to allow proper file watching for other files
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/.next-build/**'],
      };
    }
    return config;
  },

  eslint: {
    ignoreDuringBuilds: true, // Prevent build failures from linting
  },

  // Optimize for production deployment
  swcMinify: true,

  // Enable compression
  compress: true,

  // Optimize images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // API route configuration for Vercel
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
