import ThrottleGuard from '../src/services/ThrottleGuard';
import SlidingWindowStrategy from '../src/strategies/SlidingWindowStrategy';
import keyGenerator from '../src/utils/keyGenerator';

describe('SlidingWindowStrategy Tests', () => {
  let guard;
  let logEntries;

  beforeEach(() => {
    console.log('\nRunning SlidingWindowStrategy Test...');
    logEntries = [];
    guard = new ThrottleGuard({
      logger: {
        logLevel: 'debug',
        enabled: true,
        fn: (entry) => {
          logEntries.push(entry);
          // console.log(JSON.stringify(entry, null, 2))
        }
      },
      errorMessages: {
        default: 'Basic rate limit exceeded',
        basic: 'Basic rate limit exceeded',
        free: 'Basic rate limit exceeded',
        premium: 'Basic rate limit exceeded',
        window: 'Basic rate limit exceeded'
      }
    });
  });

  describe('User Tier Rate Limiting', () => {
    beforeEach(() => {
      console.log('  Testing User Tier Rate Limiting...');
      guard.setStrategy('free', new SlidingWindowStrategy(1000, 2));
      guard.setStrategy('premium', new SlidingWindowStrategy(1000, 5));
    });

    it('should enforce free tier limits', async () => {
      const userId = 'free-123';
      const key = keyGenerator.fromUserId(userId);
      let successCount = 0;

      for (let i = 0; i < 4; i++) {
        try {
          await guard.handleRequest({
            key,
            strategyName: 'free',
            context: { userId, path: '/api/data', method: 'GET' },
            handler: async () => { successCount++; }
          });
        } catch (error) {
          expect(error.message).toBe('Basic rate limit exceeded');
        }
      }

      expect(successCount).toBe(2);
      expect(logEntries.length).toBe(2);
    });

    it('should enforce premium tier limits', async () => {
      const userId = 'premium-456';
      const key = keyGenerator.fromUserId(userId);
      let successCount = 0;

      for (let i = 0; i < 7; i++) {
        try {
          await guard.handleRequest({
            key,
            strategyName: 'premium',
            context: { userId, path: '/api/data', method: 'GET' },
            handler: async () => { successCount++; }
          });
        } catch (error) {
          expect(error.message).toBe('Basic rate limit exceeded');
        }
      }

      expect(successCount).toBe(5);
      expect(logEntries.length).toBe(2);
    });
  });

  describe('Time Window Behavior', () => {
    beforeEach(() => {
      console.log('  Testing Time Window Behavior...');
      guard.setStrategy('window', new SlidingWindowStrategy(500, 3));
    });

    it('should reset limits after window expires', async () => {
      const ip = '192.168.1.3';
      const key = keyGenerator.fromIP(ip);
      let successCount = 0;

      // First batch of requests
      for (let i = 0; i < 4; i++) {
        try {
          await guard.handleRequest({
            key,
            strategyName: 'window',
            context: { ip, path: '/api/data', method: 'GET' },
            handler: async () => { successCount++; }
          });
        } catch (error) {
          expect(error.message).toBe('Basic rate limit exceeded');
        }
      }

      expect(successCount).toBe(3);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 500));

      // Second batch of requests
      successCount = 0;
      for (let i = 0; i < 3; i++) {
        await guard.handleRequest({
          key,
          strategyName: 'window',
          context: { ip, path: '/api/data', method: 'GET' },
          handler: async () => { successCount++; }
        });
      }

      expect(successCount).toBe(3);
    });
  });
});