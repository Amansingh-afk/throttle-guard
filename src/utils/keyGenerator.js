const keyGenerator = {
    fromIP: (ip) => `ip:${ip}`,
    fromUserId: (userId) => `user:${userId}`
};

export default keyGenerator;