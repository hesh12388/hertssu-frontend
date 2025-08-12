
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";


export function createApi(
  getAccessToken: () => string | null,
  refreshTokens: (error: any) => Promise<string>,
  logout: () => Promise<void>
): AxiosInstance {
  const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API,
  });

  // Request Interceptor
  api.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }
    );

  // Response interceptor
  let isRefreshing = false;
  let waitList: Array<() => void> = []; 

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error?.response?.status;
        const original = error?.config || {};
        
        if (status === 401 && !original._retry) {
            original._retry = true;

            if (isRefreshing) {
                return new Promise((resolve) => {
                    waitList.push(() => {
                        resolve(api(original));
                    });
                });
            }

            isRefreshing = true;
            try {
                const newToken = await refreshTokens(error);

                original.headers = original.headers ?? {};
                original.headers.Authorization = `Bearer ${newToken}`;

                waitList.forEach((resume) => resume());
                waitList = [];
                isRefreshing = false;

                return api(original);
            } catch (e) {
                waitList = [];
                isRefreshing = false;
                await logout();
                return Promise.reject(e);
            }
        }
      return Promise.reject(error);
    }
  );

  return api;
}
