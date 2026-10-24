/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: [
      "firebase-admin",
      "yahoo-finance2",
      "@google/genai",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://sites.google.com https://*.google.com https://*.googleusercontent.com https://classroom.google.com;",
          },
          {
            key: "X-SGX-Edu-Platform",
            value: "Google-Cloud-Run-Firebase-App-Hosting",
          },
        ],
      },
    ];
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );
    return config;
  },
};

module.exports = nextConfig;
