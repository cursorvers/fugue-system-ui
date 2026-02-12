/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' wss: ws:",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// Bundle analyzer — enable with ANALYZE=true
if (process.env.ANALYZE === "true") {
  try {
    const withBundleAnalyzer = require("@next/bundle-analyzer")({
      enabled: true,
    });
    module.exports = withBundleAnalyzer(nextConfig);
  } catch {
    // @next/bundle-analyzer not installed — skip
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}
