/**
 * Axios instance configured for the LayerZero OApp Security Monitor frontend.
 * 
 * - Base URL is set from `NEXT_PUBLIC_API_URL` environment variable.
 * - Request interceptor automatically attaches a JWT access token to all requests 
 *   except for public endpoints listed in `PUBLIC_PATHS`.
 * - Response interceptor handles 401 Unauthorized errors by attempting to refresh 
 *   the access token using the refresh token. If the refresh fails, the user is 
 *   logged out and redirected to the login page.
 * 
 * @module api
 * @see {@link PUBLIC_PATHS} - list of public endpoints that do not required auth.
 */

import axios from 'axios';


// Configured Axios instance with base URL from environment
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// List of URL prefixes that do not require an `Authorization` header
const PUBLIC_PATHS = ['/dvn-configs/', '/public/add-oapp/', '/security-reports/']


/**
 * Request interceptor: adds `Authorization: Bearer <token>` header to
 * all requests except those matching any prefix in `PUBLIC_PATHS`.
 * If no token is present in localStorage, the header is omitted.
 *
 * @param config - Axios request configuration.
 * @returns The modified configuration.
 */
api.interceptors.request.use((config) => {
  const isPublic = PUBLIC_PATHS.some((path) => config.url?.startsWith(path));

  if (!isPublic) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Response interceptor: handles 401 Unauthorized errors by trying to
 * refresh the access token using the refresh token stored in localStorage.
 *
 * If multiple requests fail with 401 concurrently, only one refresh attempt
 * is made; the others are queued and retried once the token is renewed.
 * If refresh fails (e.g., refresh token expired), the user is logged out.
 *
 * @param response - Successful response (passed through).
 * @param error - Failed response (handled).
 * @returns Resolved response or retried request.
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If refresh already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        const { data } = await api.post('/auth/jwt/refresh/', { refresh: refreshToken });
        localStorage.setItem('access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        // Process queued requests with the new token
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, log out and redirect
        processQueue(refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // For other errors, just reject
    return Promise.reject(error);
  }
);

export default api;