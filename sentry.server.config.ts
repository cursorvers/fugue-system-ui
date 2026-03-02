import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA
    ? `fugue-system-ui@${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
    : undefined,

  // Performance: sample 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Security: no PII
  sendDefaultPii: false,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  beforeSend(event) {
    // Scrub PII from request headers (server-side)
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
    return event;
  },
});
