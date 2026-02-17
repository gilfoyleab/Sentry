export class ArchestraApiError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = "ArchestraApiError";
    }
}

export class ServerNotFoundError extends Error {
    constructor(serverName: string) {
        super(`Server "${serverName}" not found in Archestra catalog`);
        this.name = "ServerNotFoundError";
    }
}

export function formatError(error: unknown): string {
    if (error instanceof ArchestraApiError) {
        return `Sentry (Archestra API Error): ${error.message}`;
    }
    if (error instanceof ServerNotFoundError) {
        return `Sentry (Server Error): ${error.message}`;
    }
    return `Sentry (Internal Error): ${error instanceof Error ? error.message : String(error)}`;
}
