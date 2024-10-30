/**
 * @typedef {'debug' | 'info' | 'warn' | 'error'} LogLevel
 */

/**
 * @typedef {Object} Bucket
 * @property {number} tokens - Current token count
 * @property {number} lastRefill - Last refill timestamp
 */

/**
 * @typedef {Object} RateLimitStrategy
 * @property {(key: string) => boolean} isAllowed - Check if request is allowed
 * @property {(key: string) => number} [getRetryAfter] - Get retry time in ms
 * @property {() => void} [reset] - Reset strategy state
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} timestamp - ISO timestamp
 * @property {string} type - Error type
 * @property {string} message - Error message
 * @property {string} [ip] - Request IP
 * @property {string} [path] - Request path
 * @property {string} [method] - HTTP method
 * @property {string|number} [userId] - User ID
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} LoggerOptions
 * @property {LogLevel} [level] - Log level
 * @property {boolean} [enabled] - Enable/disable logging
 * @property {(entry: LogEntry) => void} [fn] - Custom log function
 */

/**
 * @typedef {Object} RequestContext
 * @property {string} [ip] - Request IP
 * @property {string} [path] - Request path
 * @property {string} [method] - HTTP method
 * @property {string|number} [userId] - User ID
 * @property {Object} [metadata] - Additional context
 */

/**
 * @typedef {Object} HandlerOptions
 * @property {string} key - Rate limit key
 * @property {string} [strategyName] - Strategy to use
 * @property {() => Promise<any>} handler - Request handler
 * @property {RequestContext} [context] - Request context
 * @property {(error: import('./errors/RateLimitError.js').default) => any} [onThrottled] - Throttle handler
 * @property {boolean} [bypass] - Bypass rate limiting
 */

export {};