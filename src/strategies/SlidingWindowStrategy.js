import RateLimitStrategy from './RateLimitStrategy.js';

class SlidingWindowStrategy extends RateLimitStrategy {
    constructor(windowSize, maxRequests) {
        super();
        this.windowSize = windowSize;
        this.maxRequests = maxRequests;
        this.requests = new Map();
    }

    isAllowed(key) {
        const now = Date.now();
        const windowStart = now - this.windowSize;

        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        const timestamps = this.requests.get(key).filter(timestamp => timestamp > windowStart);
        timestamps.push(now);
        this.requests.set(key, timestamps);

        return timestamps.length <= this.maxRequests;
    }
}

export default SlidingWindowStrategy;