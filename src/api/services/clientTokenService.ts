import apiClient from "../client";
import publicClient from "../publicClient";
import type {
  TemporaryTokenResponse,
  PublicClientDto,
} from "../types/clientToken";

// Бэкенд отдаёт эти эндпоинты как text/plain — axios может не распарсить JSON
// в объект и вернуть строку. Приводим к объекту вручную на всякий случай.
const asObject = <T>(data: unknown): T => {
  if (typeof data === "string") {
    return JSON.parse(data) as T;
  }
  return data as T;
};

// Эндпоинт генерации на практике отдаёт не JSON-объект (как в Swagger),
// а «голый» токен-строку, например: b737c44a-b737-... .
// Поэтому парсим терпимо: если это валидный JSON-объект — берём его,
// иначе трактуем строку как сам токен и собираем объект вручную.
const normalizeTokenResponse = (
  data: unknown,
  clientId: number
): TemporaryTokenResponse => {
  if (typeof data === "object" && data !== null) {
    return data as TemporaryTokenResponse;
  }

  if (typeof data === "string") {
    const raw = data.trim();
    if (raw.startsWith("{")) {
      try {
        return JSON.parse(raw) as TemporaryTokenResponse;
      } catch {
        // Падаем в обработку «голого» токена ниже.
      }
    }
    // Строка — это сам токен (GUID). Снимаем возможные кавычки от text/plain.
    const token = raw.replace(/^"|"$/g, "");
    return {
      clientId,
      companyId: 0,
      token,
      createdAt: "",
      expiresAt: "",
    };
  }

  return {
    clientId,
    companyId: 0,
    token: "",
    createdAt: "",
    expiresAt: "",
  };
};

class ClientTokenService {
  // Генерация временного токена — выполняется авторизованным сотрудником,
  // поэтому идёт через основной apiClient (с Bearer-токеном).
  async generateTemporaryToken(
    clientId: number
  ): Promise<TemporaryTokenResponse> {
    const response = await apiClient.post("/Client/temporary-token/generate", {
      clientId,
    });
    return normalizeTokenResponse(response.data, clientId);
  }

  // Получение данных клиента по токену — публично, без авторизации,
  // поэтому идёт через publicClient (без интерсепторов).
  async getClientByTemporaryToken(token: string): Promise<PublicClientDto> {
    const response = await publicClient.get("/Client/by/temporary-token", {
      params: { token },
    });
    return asObject<PublicClientDto>(response.data);
  }
}

export default new ClientTokenService();
