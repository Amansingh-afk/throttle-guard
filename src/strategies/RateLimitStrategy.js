class RateLimitStrategy {
    isAllowed(key) {
        throw new Error('isAllowed method must be implemented');
    }
}

export default RateLimitStrategy;