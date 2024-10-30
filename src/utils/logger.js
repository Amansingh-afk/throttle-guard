class RateLimitLogger {
    constructor(options = {}) {
        this.options = {
            logLevel: 'warn',
            logFunction: console.log,
            ...options
        };
    }

    log(error, request) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: error.name,
            message: error.message,
            ip: request?.ip,
            path: request?.path,
            method: request?.method,
            userId: request?.userId,
            metadata: error.metadata
        };

        this.options.logFunction(logEntry);
        return logEntry;
    }
}

export default RateLimitLogger;