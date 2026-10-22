import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

// The access token lives in memory only (never localStorage), which limits XSS exposure.
// The long-lived refresh token is an httpOnly cookie managed by the server.
let accessToken = null;
let onAuthFailure = () => {};
let refreshPromise = null;

export const setAccessToken = (token) => { accessToken = token; };
export const setAuthFailureHandler = (fn) => { onAuthFailure = fn; };

const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const expired = error.response?.status === 401 && error.response.data?.code === 'TOKEN_EXPIRED';

    if (expired && !original._retry) {
      original._retry = true;
      try {
        // Share one refresh call between all requests that fail at the same time
        refreshPromise =
          refreshPromise ||
          axios.post(`${baseURL}/auth/refresh`, null, { withCredentials: true }).finally(() => { refreshPromise = null; });
        const { data } = await refreshPromise;
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        onAuthFailure();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
