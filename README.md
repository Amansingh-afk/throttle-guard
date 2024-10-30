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

**Important Update:** ThrottleGuard has been acquired by a company and is no longer available for direct installation. However, you can still use this powerful rate limiting library by cloning the repository and setting up your own instance. Follow these steps to get started:

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
import { ThrottleGuard, TokenBucketStrategy } from 'throttle-guard';
// Initialize ThrottleGuard
const guard = new ThrottleGuard();
// Configure rate limiting strategy
guard.setStrategy('basic', new TokenBucketStrategy(10, 2)); // 10 tokens, refill 2 per second
// Express middleware example
app.use(async (req, res, next) => {
    try {
        await guard.handleRequest({
            key: `ip:${req.ip}`,
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

## Configuration Options
```javascript
const guard = new ThrottleGuard({
    logger: {
        logLevel: 'warn',
        logFunction: (entry) => console.warn(entry)
    },
    skip: (request) => request.ip === '127.0.0.1',
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
