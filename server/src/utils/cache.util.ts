import redis from "../config/redis.js";

interface CacheOptions {
    ttl?: number; // in seconds
    prefix?: string;
}

/**
 * Generic helper to get or set cache
 */
export const getOrSetCache = async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
): Promise<T> => {
    if (!redis) return await fetchFn();

    try {
        const cachedValue = await redis.get(key);
        if (cachedValue) {
            console.log(`Cache HIT for key: ${key}`);
            return JSON.parse(cachedValue) as T;
        }

        console.log(`Cache MISS for key: ${key}`);
        const result = await fetchFn();
        await redis.setex(key, ttl, JSON.stringify(result));
        return result;
    } catch (error) {
        console.error(`Cache error for key ${key}:`, error);
        return await fetchFn();
    }
};

/**
 * Specialized helper for pagination with pre-fetching logic
 */
export const paginationCache = async <T>(
    serviceKey: string,
    params: any,
    fetchFn: (p: any) => Promise<T>,
    options: CacheOptions = {}
): Promise<T> => {
    const { ttl = 300, prefix = "cache" } = options;
    const page = parseInt(params.page) || 1;
    const cacheKey = `${prefix}:${serviceKey}:${JSON.stringify(params)}`;

    if (!redis) return await fetchFn(params);
    const client = redis;

    try {
        const cachedValue = await client.get(cacheKey);
        let result: any;

        if (cachedValue) {
            console.log(`Pagination Cache HIT: ${cacheKey}`);
            result = JSON.parse(cachedValue);
        } else {
            console.log(`Pagination Cache MISS: ${cacheKey}`);
            result = await fetchFn(params);
            await client.setex(cacheKey, ttl, JSON.stringify(result));
        }

        // --- Background Pre-fetching Logic ---
        // We attempt to fetch and cache page-1 and page+1 asynchronously
        const totalPages = result.pagination?.pages || result.pages || 0;

        // Pre-fetch Next Page
        if (page < totalPages) {
            const nextPageParams = { ...params, page: (page + 1).toString() };
            const nextKey = `${prefix}:${serviceKey}:${JSON.stringify(nextPageParams)}`;
            
            client.get(nextKey).then(async (exists: string | null) => {
                if (!exists) {
                    console.log(`Pre-fetching NEXT page: ${page + 1}`);
                    const nextResult = await fetchFn(nextPageParams);
                    await client.setex(nextKey, ttl, JSON.stringify(nextResult));
                }
            }).catch((err: any) => console.error("Next page pre-fetch error:", err));
        }

        // Pre-fetch Previous Page
        if (page > 1) {
            const prevPageParams = { ...params, page: (page - 1).toString() };
            const prevKey = `${prefix}:${serviceKey}:${JSON.stringify(prevPageParams)}`;

            client.get(prevKey).then(async (exists: string | null) => {
                if (!exists) {
                    console.log(`Pre-fetching PREV page: ${page - 1}`);
                    const prevResult = await fetchFn(prevPageParams);
                    await client.setex(prevKey, ttl, JSON.stringify(prevResult));
                }
            }).catch((err: any) => console.error("Prev page pre-fetch error:", err));
        }

        return result as T;
    } catch (error) {
        console.error(`Pagination cache error for key ${cacheKey}:`, error);
        return await fetchFn(params);
    }
};
