/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  transpilePackages: [
    "@refinedev/antd",
    "@refinedev/core",
    "@refinedev/nextjs-router",
    "antd",
    "@ant-design/icons",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL || "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
