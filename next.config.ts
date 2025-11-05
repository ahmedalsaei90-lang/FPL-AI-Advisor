import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  // Using standard .next directory for better compatibility
  // distDir: './.next-build', // Disabled to use default .next directory
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
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
