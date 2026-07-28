import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ProblemDetail } from "@/types/common"

/** The backend's base URL — also used directly by callers that build raw (non-axios) request URLs, e.g. `<img src>`. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** Shared axios instance for all backend calls. */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the bearer token from the auth store to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Single-flight refresh handling ----

interface RefreshResult {
  accessToken: string;
  expiresIn: number;
}

let refreshPromise: Promise<string> | null = null;

/** Perform (or join) a single in-flight refresh call. */
function refreshAccessToken(): Promise<string> {
  // Concurrent 401s all await the same promise so only one refresh request is issued.
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResult>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        const token = res.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Silently refreshes the access token on app startup when a prior session (persisted member)
 * exists, so viewer-relative GET data (e.g. myReaction, canEdit) is correct from first paint
 * instead of only after some later request happens to trigger the reactive 401 flow.
 */
export function bootstrapAccessToken(): Promise<void> {
  if (!useAuthStore.getState().member) {
    return Promise.resolve();
  }
  return refreshAccessToken()
    .then(() => undefined)
    .catch(() => undefined);
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthEndpoint =
      url.includes('/auth/refresh') || url.includes('/auth/login');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        useAuthStore.getState().clear();
        if (typeof window !== 'undefined') {
          window.location.assign('/auth/sign-in');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Extract a ProblemDetail from an AxiosError, falling back to a generic
 * Vietnamese message when the response body is not a ProblemDetail.
 *
 * @param error the caught error
 */
export function getProblemDetail(error: unknown): ProblemDetail {
  const fallback: ProblemDetail = {
    type: 'about:blank',
    title: 'Lỗi',
    status: 0,
    detail: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    instance: '',
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Partial<ProblemDetail>;
    if (typeof data.detail === 'string') {
      return { ...fallback, ...data } as ProblemDetail;
    }
    return { ...fallback, status: error.response.status };
  }

  return fallback;
}

/**
 * Convenience: get the user-facing detail message from any error.
 *
 * @param error the caught error
 */
export function getErrorMessage(error: unknown): string {
  return getProblemDetail(error).detail;
}
