import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './utils/auth-storage';
import { API_BASE_URL } from './client';

export const SOCIAL_BASE_URL = 'https://web.waypay.one:5002/';
export const SOCIAL_API_BASE_URL = 'https://web.waypay.one:5002/api';

const socialApiClient = axios.create({
    baseURL: SOCIAL_API_BASE_URL,
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

socialApiClient.interceptors.request.use(
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

socialApiClient.interceptors.response.use(
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
                    return socialApiClient(originalRequest);
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
                return socialApiClient(originalRequest);
            } catch (refreshError) {
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

export default socialApiClient;