import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    ? `fugue-system-ui@${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
    : undefined,

  // Performance: sample 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay: off by default (can enable later)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Security: no PII
  sendDefaultPii: false,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Filter out noise
  ignoreErrors: [
    // Browser quirks
    /ResizeObserver loop/,
    /ResizeObserver loop completed with undelivered notifications/,
    // Chunk loading failures (network issues)
    /Loading chunk .* failed/,
    /ChunkLoadError/,
    // Network errors
    /Network request failed/,
    /Failed to fetch/,
    /NetworkError/,
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
  ],

  beforeSend(event) {
    // Drop events from browser extensions
    const frames = event.exception?.values?.[0]?.stacktrace?.frames;
    if (frames?.some((f) => f.filename?.includes("extension://"))) {
      return null;
    }

    // Scrub PII from request headers
    if (event.request?.headers) {
      const sensitiveHeaders = [
        "authorization",
        "cookie",
        "set-cookie",
        "x-api-key",
        "x-forwarded-for",
      ];
      for (const header of sensitiveHeaders) {
        if (event.request.headers[header]) {
          event.request.headers[header] = "[Filtered]";
        }
      }
    }

    // Scrub PII from request data
    if (event.request?.data && typeof event.request.data === "string") {
      event.request.data = event.request.data
        .replace(/"(password|token|secret|api_key|apiKey|access_token|refresh_token)":\s*"[^"]*"/gi, '"$1": "[Filtered]"')
        .replace(/"(email)":\s*"[^"]*"/gi, '"$1": "[Filtered]"');
    }

    return event;
  },
});
