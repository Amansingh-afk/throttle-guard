import ThrottleGuard from '../src/services/ThrottleGuard';
import TokenBucketStrategy from '../src/strategies/TokenBucketStrategy';
import keyGenerator from '../src/utils/keyGenerator';

describe('TokenBucketStrategy Tests', () => {
  let guard;
  let logEntries;

  beforeEach(() => {
    console.log('\nRunning TokenBucketStrategy Test...');
    logEntries = [];
    guard = new ThrottleGuard({
      logger: {
        logLevel: 'debug',
        enabled: true,
        fn: (entry) => {
          logEntries.push(entry);
        }
      },
      errorMessages: {
        default: 'Basic rate limit exceeded',
        basic: 'Basic rate limit exceeded',
        auth: 'Too many login attempts'
      }
    });
  });

  describe('Basic Rate Limiting', () => {
    beforeEach(() => {
      console.log('  Testing Basic Rate Limiting...');
      guard.setStrategy('basic', new TokenBucketStrategy(3, 1));
    });

    it('should allow burst up to bucket size', async () => {
      const ip = '192.168.1.1';
      const key = keyGenerator.fromIP(ip);
      
      // Should allow 3 immediate requests
      for (let i = 0; i < 3; i++) {
        const result = await guard.handleRequest({
          key,
          strategyName: 'basic',
          context: { ip, path: '/api/data', method: 'GET' },
          handler: async () => `success-${i}`
        });
        expect(result).toBe(`success-${i}`);
      }
      expect(logEntries.length).toBe(0);
    });

    it('should reject requests when bucket is empty', async () => {
      const ip = '192.168.1.1';
      const key = keyGenerator.fromIP(ip);
      
      // Exhaust the bucket
      for (let i = 0; i < 3; i++) {
        await guard.handleRequest({
          key,
          strategyName: 'basic',
          context: { ip, path: '/api/data', method: 'GET' },
          handler: async () => 'success'
        });
      }

      // Additional request should fail
      await expect(guard.handleRequest({
        key,
        strategyName: 'basic',
        context: { ip, path: '/api/data', method: 'GET' },
        handler: async () => 'success'
      })).rejects.toThrow('Basic rate limit exceeded');
      
      expect(logEntries.length).toBe(1);
    });
  });

  describe('API Authentication Limiting', () => {
    beforeEach(() => {
      console.log('  Testing API Authentication Limiting...');
      guard.setStrategy('auth', new TokenBucketStrategy(3, 0.2));
    });

    it('should limit login attempts', async () => {
      const ip = '192.168.1.2';
      const key = keyGenerator.custom('auth', ip);
      let attempts = 0;

      // Try 5 login attempts
      for (let i = 0; i < 5; i++) {
        try {
          await guard.handleRequest({
            key,
            strategyName: 'auth',
            context: { ip, path: '/auth/login', method: 'POST' },
            handler: async () => { attempts++; }
          });
        } catch (error) {
          expect(error.message).toBe('Too many login attempts');
        }
      }

      expect(attempts).toBe(3);
      expect(logEntries.length).toBe(2);
    });
  });
});