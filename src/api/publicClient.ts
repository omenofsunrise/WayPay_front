import axios from "axios";
import { API_BASE_URL } from "./client";

// Отдельный axios-клиент БЕЗ интерсепторов авторизации.
// Публичные страницы (например, просмотр клиента по временному токену)
// не должны подставлять Bearer-токен и не должны редиректить на /auth
// при 401/403 — иначе неавторизованный пользователь по ссылке будет выкинут.
const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default publicClient;
