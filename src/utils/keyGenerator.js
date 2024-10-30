/**
 * @typedef {Object} KeyGenerator
 * @property {(ip: string) => string} fromIP
 * @property {(userId: string|number) => string} fromUserId
 * @property {(prefix: string, ...parts: (string|number)[]) => string} custom
 */

/** @type {KeyGenerator} */
const keyGenerator = {
  /**
   * @param {string} ip
   * @returns {string}
   */
  fromIP: (ip) => `ip:${ip}`,

  /**
   * @param {string|number} userId
   * @returns {string}
   */
  fromUserId: (userId) => `user:${userId}`,

  /**
   * @param {string} prefix
   * @param {...(string|number)} parts
   * @returns {string}
   */
  custom: (prefix, ...parts) => `${prefix}:${parts.join(':')}`
};

export default keyGenerator;