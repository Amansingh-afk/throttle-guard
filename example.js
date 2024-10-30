import ThrottleGuard from './services/ThrottleGuard.js';
import TokenBucketStrategy from './strategies/TokenBucketStrategy.js';
import keyGenerator from './utils/keyGenerator.js';

const guard = new ThrottleGuard({
    logger: {
        logLevel: 'warn',
        logFunction: (entry) => {
            console.warn(`Rate limit exceeded: ${JSON.stringify(entry)}`);
        }
    },
    skip: (request) => request.ip === '127.0.0.1', // Skip localhost
    errorMessages: {
        basic: 'Rate limit exceeded. Please try again later.',
        strict: 'Too many requests. Please wait a minute.'
    }
});

// Configure strategies
guard.setStrategy('basic', new TokenBucketStrategy(10, 2));

// Express middleware
app.use(async (req, res, next) => {
    try {
        await guard.handleRequest({
            key: keyGenerator.fromIP(req.ip),
            strategyName: 'basic',
            request: {
                ip: req.ip,
                path: req.path,
                method: req.method,
                userId: req.user?.id
            },
            handler: async () => next(),
            onThrottled: (error) => {
                const retryAfter = error.metadata.strategy.getRetryAfter(req.ip);
                res.set('Retry-After', Math.ceil(retryAfter / 1000));
                res.status(429).json({
                    error: error.message,
                    retryAfter
                });
            }
        });
    } catch (error) {
        next(error);
    }
});