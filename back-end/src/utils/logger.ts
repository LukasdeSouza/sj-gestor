/**
 * Structured logging utility for PIX operations
 */

interface LogContext {
  userId?: string;
  subscriptionId?: string;
  adminId?: string;
  planId?: string;
  [key: string]: any;
}

class Logger {
  private prefix = '[PIX]';

  /**
   * Log info level message
   */
  info(message: string, context?: LogContext) {
    console.log(`${this.prefix} [INFO] ${message}`, context ? JSON.stringify(context) : '');
  }

  /**
   * Log warning level message
   */
  warn(message: string, context?: LogContext) {
    console.warn(`${this.prefix} [WARN] ${message}`, context ? JSON.stringify(context) : '');
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error | string | unknown, context?: LogContext) {
    const errorMsg = error instanceof Error ? error.message : typeof error === 'string' ? error : String(error);
    console.error(`${this.prefix} [ERROR] ${message}`, {
      error: errorMsg,
      ...context,
    });
  }

  /**
   * Log debug level message
   */
  debug(message: string, context?: LogContext) {
    if (process.env.DEBUG === 'true') {
      console.debug(`${this.prefix} [DEBUG] ${message}`, context ? JSON.stringify(context) : '');
    }
  }
}

export const logger = new Logger();
