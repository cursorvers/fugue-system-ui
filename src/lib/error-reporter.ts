/**
 * Error reporting abstraction.
 *
 * Development: structured console.error
 * Production: Sentry drop-in point (replace implementation only)
 */

interface ErrorContext {
  readonly component?: string;
  readonly action?: string;
  readonly userId?: string;
  readonly [key: string]: unknown;
}

/**
 * Report an error with structured context.
 * In production, replace this with Sentry.captureException().
 */
export function reportError(error: Error, context?: ErrorContext): void {
  if (process.env.NODE_ENV === "production") {
    // Production: Sentry integration point
    // Sentry.captureException(error, { extra: context });
    console.error("[FUGUE Error]", {
      message: error.message,
      name: error.name,
      ...context,
    });
  } else {
    // Development: full stack trace with context
    console.error("[FUGUE Error]", error.message, context ?? {});
    console.error(error.stack);
  }
}
