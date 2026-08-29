import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../apiConfig';

// Global cache with TTL
const dataCache = new Map();
const inFlightRequests = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (endpoint) => `cache_${endpoint}`;

const getCachedData = (endpoint) => {
  const cacheKey = getCacheKey(endpoint);
  const cached = dataCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  dataCache.delete(cacheKey);
  return null;
};

const setCachedData = (endpoint, data) => {
  const cacheKey = getCacheKey(endpoint);
  dataCache.set(cacheKey, { data, timestamp: Date.now() });
};

const clearCache = (endpoint) => {
  const cacheKey = getCacheKey(endpoint);
  dataCache.delete(cacheKey);
};

export const useFetchData = (endpoint, dependencies = [], options = {}) => {
  const { skipCache = false, cacheDuration = CACHE_DURATION } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Check cache first
    if (!skipCache) {
      const cached = getCachedData(endpoint);
      if (cached) {
        setData(cached);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // If request is already in flight, wait for it
    if (inFlightRequests.has(endpoint)) {
      inFlightRequests.get(endpoint).then((result) => {
        if (isMounted.current) {
          setData(result);
          setLoading(false);
          setError(null);
        }
      }).catch((err) => {
        if (isMounted.current) {
          setError(err.message);
          setLoading(false);
        }
      });
      return;
    }

    // Create fetch promise
    const fetchPromise = (async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Cache-Control': 'no-cache'
          },
          cache: skipCache ? 'no-store' : 'default'
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Cache the result
        setCachedData(endpoint, result);
        inFlightRequests.delete(endpoint);
        
        if (isMounted.current) {
          setData(result);
          setError(null);
        }
        
        return result;
      } catch (err) {
        console.error(`Error fetching from ${endpoint}:`, err);
        inFlightRequests.delete(endpoint);
        
        if (isMounted.current) {
          setError(err.message);
          setData(null);
        }
        
        throw err;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    })();

    // Store the promise to prevent duplicate requests
    inFlightRequests.set(endpoint, fetchPromise);

  }, dependencies);

  return { data, loading, error, clearCache: () => clearCache(endpoint) };
};

export const postData = async (endpoint, payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Clear related caches after POST
    clearCache(endpoint);
    
    return result;
  } catch (err) {
    console.error(`Error posting to ${endpoint}:`, err);
    throw err;
  }
};

// Clear cache programmatically (useful after mutations like delete/update)
export const clearDataCache = (endpoint) => {
  const cacheKey = getCacheKey(endpoint);
  dataCache.delete(cacheKey);
  if (inFlightRequests.has(endpoint)) inFlightRequests.delete(endpoint);
};
