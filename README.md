# ThrottleGuard - Rate Limiting Library

A flexible and extensible rate limiting library for Node.js applications with support for multiple rate limiting strategies.

## Features

- Multiple rate limiting strategies:
  - Token Bucket Algorithm
  - Sliding Window Algorithm
- Docker support for development and testing
- Configurable logging
- IP-based and User-based rate limiting
- Customizable error messages
- Retry-After header support

## Installation
**Important Update:** ThrottleGuard's distribution model has changed, and it is no longer available through traditional installation methods. Instead, you can clone the repository and set up a self-hosted instance. To get started, follow these steps:

### Option 1: Using Docker (Recommended)

1. Clone the ThrottleGuard repository:

    `git clone https://github.com/throttle-guard/throttle-guard.git`

    `cd throttle-guard`
2. Build and run with Docker Compose:
    `docker compose up --build`

    This will:
    - Build the Docker image
    - Install all dependencies
    - Run the test suite
    - Watch for changes


### Option 2: Direct Installation

1. Clone the repository:

    `git clone https://github.com/throttle-guard/throttle-guard.git`

    `cd throttle-guard`

2. Install dependencies:
    `npm install`

## Quick Start

```javascript
import ThrottleGuard from 'throttle-guard';
import { TokenBucketStrategy } from 'throttle-guard';
import keyGenerator from './utils/keyGenerator';
// Initialize ThrottleGuard
const guard = new ThrottleGuard({
    logger: {
        logLevel: 'warn',
        logFunction: (entry) => console.warn(entry)
    },
    skip: (request) => request.ip === '127.0.0.1', // Skip localhost
    errorMessages: {
        basic: 'Rate limit exceeded. Please try again later.',
        strict: 'Too many requests. Please wait a minute.'
    }
});
// Configure rate limiting strategy
// 10 tokens, refill 2 per second
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
```

## Rate Limiting Strategies

### Token Bucket Strategy
The Token Bucket algorithm uses a bucket that continuously fills with tokens at a fixed rate. Each request consumes one token, and requests are rejected when no tokens are available.

```javascript
const strategy = new TokenBucketStrategy(
    capacity: 10, // Maximum tokens
    refillRate: 2 // Tokens added per second
);
```


### Sliding Window Strategy
The Sliding Window algorithm tracks requests within a time window that continuously moves forward, providing more accurate rate limiting.

```javascript
const strategy = new SlidingWindowStrategy(
    windowSize: 60000, // Window size in milliseconds
    maxRequests: 30 // Maximum requests per window
);
```

## Advanced Usage

### User-Based Rate Limiting

```javascript
import ThrottleGuard from 'throttle-guard';
import { SlidingWindowStrategy } from 'throttle-guard';
import { keyGenerator } from 'throttle-guard';

const guard = new ThrottleGuard();

// Different limits for free vs premium users
guard.setStrategy('free', new SlidingWindowStrategy(60000, 100));  // 100 requests per minute
guard.setStrategy('premium', new SlidingWindowStrategy(60000, 1000));  // 1000 requests per minute

async function userRateLimit(req, res, next) {
  const strategyName = req.user?.isPremium ? 'premium' : 'free';
  const key = keyGenerator.fromUserId(req.user.id);

  try {
    await guard.handleRequest({
      key,
      strategyName,
      request: {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: req.user.id
      },
      handler: async () => next(),
      onThrottled: (error) => {
        res.status(429).json({
          error: error.message,
          retryAfter: error.getRetryAfter(),
          upgradeUrl: strategyName === 'free' ? '/upgrade-plan' : null // or whatever you want
        });
      }
    });
  } catch (error) {
    next(error);
  }
}
```
### API Route-specific Limits
```javascript
import ThrottleGuard from 'throttle-guard';
import { TokenBucketStrategy } from 'throttle-guard';

const guard = new ThrottleGuard();

// Different strategies for different endpoints
guard.setStrategy('auth', new TokenBucketStrategy(5, 1)); // 5 login attempts per second
guard.setStrategy('api', new TokenBucketStrategy(30, 5)); // 30 API calls, refills 5 per second

// Auth endpoint middleware
app.post('/login', rateLimitMiddleware('auth'), loginHandler);

// API endpoint middleware
app.use('/api', rateLimitMiddleware('api'));

function rateLimitMiddleware(strategyName) {
  return async (req, res, next) => {
    try {
      await guard.handleRequest({
        key: `${strategyName}:${req.ip}`,
        strategyName,
        request: {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userId: req.user?.id
        },
        handler: async () => next(),
        onThrottled: (error) => {
          res.status(429).json({
            error: error.message,
            retryAfter: error.getRetryAfter()
          });
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
```

## Configuration Options
```javascript
const guard = new ThrottleGuard({
    // Logging configuration
    logger: {
        logLevel: 'warn',
        logFunction: (entry) => {
            console.warn(`Rate limit exceeded: ${JSON.stringify(entry)}`);
        }
        enabled: true  // Enable/disable logging
    },
    // Skip certain requests from rate limiting (localhost in this case)
    skip: (request) => request.ip === '127.0.0.1',
    // Custom error messages
    errorMessages: {
        basic: 'Rate limit exceeded. Please try again later.',
        strict: 'Too many requests. Please wait a minute.'
    }
});
```

## Running Tests

Run tests once  `docker compose run test`

Run tests in watch mode `docker compose run dev`

#### In case of Direct Installation:

Run tests once `npm test`

Run tests in watch mode `npm run test:watch`

## Learn More

- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Sliding Window Algorithm](https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm)
- [Rate Limiting Patterns](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

## License

ISC
