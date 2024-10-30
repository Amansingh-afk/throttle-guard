/** @implements {import('../types.js').Logger} */
class RateLimitLogger {
    /**
     * @param {import('../types.js').LoggerOptions} [options]
     */
    constructor(options = {}) {
        this.options = {
            level: 'warn',
            enabled: true,
            fn: console.log,
            ...options
        };
    }

    /**
     * @param {import('../errors/RateLimitError.js').default} error
     * @param {import('../types.js').RequestContext} [request]
     * @returns {import('../types.js').LogEntry}
     */
    log(error, request) {
        if (!this.options.enabled) return;

        const entry = {
            timestamp: new Date().toISOString(),
            type: error.name,
            message: error.message,
            ip: request?.ip,
            path: request?.path,
            method: request?.method,
            userId: request?.userId,
            metadata: error.metadata
        };

        this.options.fn(entry);
        return entry;
    }
}

export default RateLimitLogger;