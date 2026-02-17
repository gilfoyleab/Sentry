export enum LogLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    DEBUG = "debug",
}

export function log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const entry = {
        timestamp,
        level,
        message,
        ...data,
    };

    if (process.env.LOG_LEVEL === "debug" || level !== LogLevel.DEBUG) {
        console.error(JSON.stringify(entry));
    }
}
