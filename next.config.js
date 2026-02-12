/** @type {import('next').NextConfig} */
const nextConfig = {};

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
