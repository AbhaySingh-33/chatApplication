import { createClient } from "redis";

let pubClient;
let subClient;
let redisConnected = false;

/**
 * Initialize Redis clients for Socket.IO Redis Adapter
 * @returns {Promise<Object>} { pubClient, subClient, connected: boolean }
 */
export const initializeRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    // Create publisher client
    pubClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("Redis reconnection failed after 10 retries");
            return new Error("Redis max retries exceeded");
          }
          return retries * 100;
        },
      },
    });

    // Create subscriber client (required by Socket.IO adapter)
    subClient = pubClient.duplicate();

    // Error handlers for pubClient
    pubClient.on("error", (err) => {
      console.error("Redis pubClient error:", err.message);
      redisConnected = false;
    });

    pubClient.on("connect", () => {
      console.log("Redis pubClient connected");
    });

    pubClient.on("ready", () => {
      console.log("Redis pubClient ready");
      redisConnected = true;
    });

    pubClient.on("end", () => {
      console.log("Redis pubClient disconnected");
      redisConnected = false;
    });

    // Error handlers for subClient
    subClient.on("error", (err) => {
      console.error("Redis subClient error:", err.message);
    });

    subClient.on("connect", () => {
      console.log("Redis subClient connected");
    });

    subClient.on("ready", () => {
      console.log("Redis subClient ready");
    });

    // Connect both clients
    await pubClient.connect();
    await subClient.connect();

    console.log("Redis initialized successfully");

    return {
      pubClient,
      subClient,
      connected: true,
    };
  } catch (error) {
    console.error("Failed to initialize Redis:", error.message);
    console.warn(
      "⚠ Redis is optional. Continuing without Redis adapter (single-server mode)."
    );
    return {
      pubClient: null,
      subClient: null,
      connected: false,
    };
  }
};

/**
 * Get current Redis connection status
 */
export const isRedisConnected = () => redisConnected;

/**
 * Get Redis clients
 */
export const getRedisClients = () => ({
  pubClient,
  subClient,
});

/**
 * Gracefully close Redis connections
 */
export const closeRedis = async () => {
  try {
    if (pubClient) {
      await pubClient.quit();
      console.log("Redis pubClient closed");
    }
    if (subClient) {
      await subClient.quit();
      console.log("Redis subClient closed");
    }
  } catch (error) {
    console.error("Error closing Redis connections:", error.message);
  }
};

/**
 * Track online user in Redis (optional enhancement)
 * Stores user -> socket mapping and active users set
 */
export const trackOnlineUser = async (userId, socketId) => {
  try {
    if (!pubClient || !redisConnected) return;

    // Add to onlineUsers set
    await pubClient.sAdd("onlineUsers", userId);

    // Store socket mapping in hash
    await pubClient.hSet("sockets", userId, socketId);

    // Set expiry to 24 hours (in case socket connection drops unexpectedly)
    await pubClient.expire(`socket:${userId}`, 86400);
  } catch (error) {
    console.error("Error tracking online user:", error.message);
  }
};

/**
 * Remove user from online tracking in Redis (optional enhancement)
 */
export const trackOfflineUser = async (userId) => {
  try {
    if (!pubClient || !redisConnected) return;

    // Remove from onlineUsers set
    await pubClient.sRem("onlineUsers", userId);

    // Remove socket mapping
    await pubClient.hDel("sockets", userId);
  } catch (error) {
    console.error("Error tracking offline user:", error.message);
  }
};

/**
 * Get all online users from Redis
 */
export const getOnlineUsersFromRedis = async () => {
  try {
    if (!pubClient || !redisConnected) return [];

    return await pubClient.sMembers("onlineUsers");
  } catch (error) {
    console.error("Error getting online users:", error.message);
    return [];
  }
};
