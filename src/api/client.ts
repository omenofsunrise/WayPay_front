import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://web.waypay.one:5001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем интерцепторы при необходимости
apiClient.interceptors.request.use(
    (config) => {
        // Можно добавить токен авторизации и т.д.
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Обработка ошибок
        return Promise.reject(error);
    }
);

export default apiClient;