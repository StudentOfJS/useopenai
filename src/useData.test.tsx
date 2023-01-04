import { act, renderHook } from '@testing-library/react-hooks';
import useData from './useData';

describe('useData', () => {
  beforeEach(() => {
    // Mock the fetch function to return a successful response
    window.globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: 'test data' }),
      headers: {
        get: jest.fn().mockReturnValue('max-age=3600'),
      },
    });
  });

  afterEach(() => {
    // Clear the mock after each test
    jest.clearAllMocks();
  });

  it('should fetch data and set it in the cache', async () => {
    // Render the hook with a test URL
    const { result, waitForNextUpdate } = renderHook(() => useData('/test'));

    // Wait for the data to be fetched
    await waitForNextUpdate();

    // Check the hook state
    expect(result.current.data).toEqual({ data: 'test data' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    // Check that the fetch function was called with the correct arguments
    expect(fetch).toHaveBeenCalledWith('/test', expect.any(Object));

    // Check that the response was added to the cache
    const cache = await caches.open('my-cache');
    const cachedResponse = await cache.match('/test');
    expect(cachedResponse).toBeDefined();
  });

  it('should return cached data if it is available', async () => {
    // Add data to the cache
    const cache = await caches.open('my-cache');
    cache.put('/test', {
      ok: true,
      json: jest.fn().mockResolvedValue({ data: 'test data' }),
      // @ts-ignore missing unused header methods
      headers: {
        get: jest.fn().mockReturnValue('max-age=3600'),
      },
    });

    // Render the hook with a test URL
    const { result, waitForNextUpdate } = renderHook(() => useData('/test'));

    // Wait for the data to be fetched
    await waitForNextUpdate();

    // Check the hook state
    expect(result.current.data).toEqual({ data: 'test data' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    // Check that the fetch function was not called
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    // Mock the fetch function to return an error
    window.globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error('Fetch error'));

    // Render the hook with a test URL
    const { result, waitForNextUpdate } = renderHook(() => useData('/test'));

    // Wait for the data to be fetched
    await waitForNextUpdate();

    // Check the hook state
    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error('Fetch error'));

    // Check that the fetch function was called with the correct arguments
    expect(fetch).toHaveBeenCalledWith('/test', expect.any(Object));

    // Check that the error was not added to the cache
    const cache = await caches.open('my-cache');
    const cachedResponse = await cache.match('/test');
    expect(cachedResponse).toBe(undefined);
  });
});
