const { withSentryConfig } = require("@sentry/nextjs");

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
              "connect-src 'self' wss://cockpit-public-ws.masa-stage1.workers.dev https://*.supabase.co https://*.sentry.io",
              "manifest-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  // Suppress source map upload logs in CI
  silent: true,
  // Upload source maps to Sentry for readable stack traces
  org: "cursorvers",
  project: "javascript-react",
  // Auth token for source map uploads (set SENTRY_AUTH_TOKEN in Vercel env vars)
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

// Build the final config, composing Sentry + optional bundle analyzer
let finalConfig = withSentryConfig(nextConfig, sentryWebpackPluginOptions);

// Bundle analyzer — enable with ANALYZE=true
if (process.env.ANALYZE === "true") {
  try {
    const withBundleAnalyzer = require("@next/bundle-analyzer")({
      enabled: true,
    });
    finalConfig = withBundleAnalyzer(finalConfig);
  } catch {
    // @next/bundle-analyzer not installed — skip
  }
}

module.exports = finalConfig;
