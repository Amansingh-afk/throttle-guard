import express from 'express';
import ThrottleGuard from './services/ThrottleGuard.js';
import TokenBucketStrategy from './strategies/TokenBucketStrategy.js';
import SlidingWindowStrategy from './strategies/SlidingWindowStrategy.js';
import keyGenerator from './utils/keyGenerator.js';

const app = express();
const guard = new ThrottleGuard();

// Configure different strategies
guard.setStrategy('basic', new TokenBucketStrategy(10, 2)); // 10 tokens, refill 2 per second
guard.setStrategy('strict', new SlidingWindowStrategy(60000, 30)); // 30 requests per minute

// Example usage with Express
app.use(async (req, res, next) => {
    try {
        const result = await guard.handleRequest({
            key: keyGenerator.fromIP(req.ip),
            strategyName: 'basic',
            handler: async () => next(),
            onThrottled: () => {
                res.status(429).json({ error: 'Rate limit exceeded' });
            }
        });
    } catch (error) {
        next(error);
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});