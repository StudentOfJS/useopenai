import { useState, useEffect, useRef, useCallback } from 'react';

type DataHookResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

type UseDataHookProps<T> = {
  url: string;
  init?: RequestInit;
  optimisticData?: T;
  useStaleCache?: boolean;
  retry?: number;
  onError?: (error: Error) => void;
  invalidateCache?: boolean;
  cacheKey?: string;
  expiration?: number;
  errorHandlers?: Record<number, (error: Error) => void>;
};

function useData<T>({
  url,
  init,
  optimisticData,
  useStaleCache,
  retry = 0,
  onError,
  invalidateCache = false,
  cacheKey = url,
  expiration,
  errorHandlers,
}: UseDataHookProps<T>): DataHookResult<T> {
  const [data, setData] = useState<T | null>(optimisticData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(retry);
  const retryTimer = useRef<ReturnType<typeof setInterval>>();
  const controller = useRef(new AbortController());
  const fetchData = useCallback(async () => {
    if (optimisticData) {
      setLoading(false);
    }
    try {
      // Check if the data is in the cache
      const cache = await caches.open('my-cache');
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse && !invalidateCache) {
        // Get the expiration time from the response headers or the expiration option
        let expirationTime = 0;
        if (expiration) {
          expirationTime = Date.now() + expiration * 1000;
        } else {
          const cacheControl = cachedResponse.headers.get('Cache-Control');
          console.log('trying');
          if (cacheControl) {
            console.log('trying cache');
            const maxAge = cacheControl.split('max-age=')[1];
            if (maxAge) {
              expirationTime = Date.now() + Number(maxAge) * 1000;
            }
          }
        }
        // If the cache entry has not expired, return the cached data
        if (expirationTime > Date.now() || useStaleCache) {
          setData(await cachedResponse.json());
          setLoading(false);
          if (!useStaleCache) return;
        }
      }

      // If the data is not in the cache, or the cache entry has expired, fetch it from the server
      const response = await fetch(url, {
        ...init!,
        signal: controller.current.signal,
      });
      // Check the response status
      if (response.ok) {
        // Add the data to the cache for future requests, including the expiration time
        const cacheControl = response.headers.get('Cache-Control');
        if (cacheControl || expiration) {
          const request = new Request(cacheKey);
          // @ts-ignore 3rd option
          cache.put(request, response.clone(), {
            expiration: expiration || cacheControl,
          });
        }
        setData(await response.json());
      } else {
        // Throw an error with the status code and status text
        const error = new Error(
          `Error ${response.status}: ${response.statusText}`
        );
        // Call the onError callback, if provided
        if (onError) {
          onError(error);
        }
        // Call the error handler for the specific status code, if provided
        if (errorHandlers && errorHandlers[response.status]) {
          errorHandlers[response.status](error);
        }
        setError(error);
        handleRetry();
      }
    } catch (error) {
      // Call the onError callback, if provided
      if (onError && error instanceof Error) {
        onError(error);
        handleRetry();
      }
      (error instanceof Error) && setError(error);
    } finally {
      setLoading(false);
    }
  }, [
    url,
    invalidateCache,
    cacheKey,
    expiration,
    init,
    errorHandlers,
    onError,
  ]);

  function handleRetry() {
    // If retry is enabled, retry the request with an exponential backoff
    if (retryCount > 0) {
      controller.current = new AbortController();
      const delay = 2 ** (retry - retryCount + 1) * 1000;
      setRetryCount(retryCount - 1);
      retryTimer.current = setTimeout(() => fetchData(), delay);
    }
  }

  useEffect(() => {
    controller.current = new AbortController();
    return () => {
      controller.current.abort();
    };
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      clearTimeout(retryTimer.current);
    };
  }, [url, invalidateCache, cacheKey, expiration, init]);

  return { data, loading, error };
}

export default useData;
