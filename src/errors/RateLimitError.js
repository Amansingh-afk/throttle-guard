class RateLimitError extends Error {
    constructor(message, metadata = {}) {
        super(message);
        this.name = 'RateLimitError';
        this.status = 429;
        this.metadata = metadata;
        this.timestamp = Date.now();
    }
}

export default RateLimitError;