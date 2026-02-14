// Simple in-memory cache with TTL
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class ApiCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL = 30000; // 30 seconds default TTL

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        });
    }

    invalidate(keyPattern?: string): void {
        if (!keyPattern) {
            this.cache.clear();
            return;
        }

        // Invalidate keys matching the pattern
        for (const key of this.cache.keys()) {
            if (key.includes(keyPattern)) {
                this.cache.delete(key);
            }
        }
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }
}

export const apiCache = new ApiCache();

// Cache TTL configurations for different endpoints (in milliseconds)
export const CACHE_TTL = {
    PATIENTS: 60000,      // 1 minute
    MEDICINES: 120000,    // 2 minutes (stock doesn't change rapidly)
    BILLS: 30000,         // 30 seconds (more dynamic)
    LAB_ORDERS: 30000,    // 30 seconds
    MEDICAL_RECORDS: 60000, // 1 minute
    APPOINTMENTS: 15000,  // 15 seconds (frequently changing)
    STAFF: 300000,        // 5 minutes (rarely changes)
};

// Helper to generate cache keys
export const getCacheKey = (endpoint: string, params?: any): string => {
    if (!params || Object.keys(params).length === 0) {
        return endpoint;
    }
    return `${endpoint}?${JSON.stringify(params)}`;
};
