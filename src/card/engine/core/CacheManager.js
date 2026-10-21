class LRUCache {
    constructor(maxSize, ttlMs) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        
        const item = this.cache.get(key);
        if (Date.now() - item.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        // Refresh LRU
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Evict oldest (first key in map)
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, { value, timestamp: Date.now() });
    }
    
    has(key) {
        return this.get(key) !== null;
    }
}

class CacheManager {
    constructor() {
        this.caches = {
            api: new LRUCache(100, 5 * 60 * 1000), // 5 minutes TTL for API responses
            backgrounds: new LRUCache(10, 60 * 60 * 1000), // 1 hour TTL for local assets
            logos: new LRUCache(10, 60 * 60 * 1000),
            skins: new LRUCache(50, 15 * 60 * 1000), // 15 mins for 3D skins
            capes: new LRUCache(50, 60 * 60 * 1000),
            staticLayers: new LRUCache(20, 15 * 60 * 1000) // Pre-rendered canvas layers
        };
    }

    getCache(type) {
        return this.caches[type];
    }
}

// Singleton pattern
const cacheManagerInstance = new CacheManager();
module.exports = cacheManagerInstance;
