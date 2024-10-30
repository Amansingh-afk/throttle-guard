import TokenBucketStrategy from '../src/strategies/TokenBucketStrategy.js';

describe('TokenBucketStrategy', () => {
  let now;
  
  beforeEach(() => {
    now = Date.now();
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow requests within the limit and handle initial capacity', () => {
    const strategy = new TokenBucketStrategy(3, 1);
    const key = 'test-key';

    // Should allow exactly 3 requests (initial capacity)
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(true);
    // Should deny the 4th request
    expect(strategy.isAllowed(key)).toBe(false);
  });

  it('should refill tokens over time', () => {
    const strategy = new TokenBucketStrategy(2, 1); // 2 capacity, 1 token per second
    const key = 'test-key';

    // Use up initial tokens
    expect(strategy.isAllowed(key)).toBe(true); // 2 -> 1
    expect(strategy.isAllowed(key)).toBe(true); // 1 -> 0
    expect(strategy.isAllowed(key)).toBe(false); // 0 -> denied

    // Advance time by exactly 1 second
    jest.advanceTimersByTime(1000);

    // Should have 1 new token
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(false);
  });

  it('should handle multiple keys independently', () => {
    const strategy = new TokenBucketStrategy(2, 1);
    const key1 = 'test-key-1';
    const key2 = 'test-key-2';

    // Key1 operations
    expect(strategy.isAllowed(key1)).toBe(true);
    expect(strategy.isAllowed(key1)).toBe(true);
    expect(strategy.isAllowed(key1)).toBe(false);

    // Key2 should still have full capacity
    expect(strategy.isAllowed(key2)).toBe(true);
    expect(strategy.isAllowed(key2)).toBe(true);
    expect(strategy.isAllowed(key2)).toBe(false);
  });

  it('should not exceed capacity when refilling', () => {
    const strategy = new TokenBucketStrategy(2, 1);
    const key = 'test-key';

    // Use both tokens
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(false);

    // Advance time by 10 seconds
    jest.advanceTimersByTime(10000);

    // Should only have refilled to capacity (2)
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(true);
    expect(strategy.isAllowed(key)).toBe(false);
  });
});