type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string | number;
  };
}

class Logger {
  private format(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogPayload {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && {
        error: {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      }),
    };
  }

  public info(message: string, context?: Record<string, unknown>): void {
    console.log(JSON.stringify(this.format('info', message, context)));
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    console.warn(JSON.stringify(this.format('warn', message, context)));
  }

  public error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errObj = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    console.error(JSON.stringify(this.format('error', message, context, errObj)));
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify(this.format('debug', message, context)));
    }
  }
}

export const logger = new Logger();
