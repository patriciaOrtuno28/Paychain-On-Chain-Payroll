import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ["@payroll/sdk"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // MetaMask SDK 
      "@react-native-async-storage/async-storage": false,

      // WalletConnect logger
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;