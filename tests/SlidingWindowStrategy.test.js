import SlidingWindowStrategy from '../src/strategies/SlidingWindowStrategy.js';

describe('SlidingWindowStrategy', () => {
  it('should allow requests within the limit', () => {
    const strategy = new SlidingWindowStrategy(60000, 3);
    const key = 'test-key';

    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(false);
  });

  it('should allow requests after the window has passed', (done) => {
    const strategy = new SlidingWindowStrategy(1000, 1);
    const key = 'test-key';

    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(false);

    setTimeout(() => {
      expect(strategy.isAllowed(key)).toBe(true);
      done();
    }, 1100);
  }, 2000);

  it('should handle multiple keys independently', () => {
    const strategy = new SlidingWindowStrategy(60000, 2);
    const key1 = 'test-key-1';
    const key2 = 'test-key-2';

    // Key1 operations
    expect(strategy.isAllowed(key1)).toBe(true);
    expect(strategy.isAllowed(key1)).toBe(true);
    expect(strategy.isAllowed(key1)).toBe(false);

    // Key2 should be independent
    expect(strategy.isAllowed(key2)).toBe(true);
    expect(strategy.isAllowed(key2)).toBe(true);
    expect(strategy.isAllowed(key2)).toBe(false);
  });

  it('should clean up old requests from the window', (done) => {
    const strategy = new SlidingWindowStrategy(500, 2);
    const key = 'test-key';

    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(false);

    setTimeout(() => {
      expect(strategy.isAllowed(key)).toBe(true);
      done();
    }, 600);
  }, 1000);
});