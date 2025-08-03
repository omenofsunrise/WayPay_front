import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './utils/auth-storage';

export const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://web.waypay.one:5001/';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://web.waypay.one:5001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedRequestsQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedRequestsQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token!);
        }
    });
    failedRequestsQueue = [];
};

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = authStorage.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                })
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = authStorage.getRefreshToken();
                const accessToken = authStorage.getAccessToken();
                
                if (!refreshToken || !accessToken) {
                    throw new Error('No tokens available');
                }

                const response = await axios.post(`${API_BASE_URL}/Auth/refresh`, {
                    accessToken,
                    refreshToken
                });

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
                authStorage.setTokens(newAccessToken, newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);
                return apiClient(originalRequest);
            } catch (refreshError) {
                console.log();
                processQueue(refreshError as AxiosError);
                authStorage.clear();
                if (window.location.pathname !== '/auth') {
                    window.location.href = '/auth';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;