import axios from "axios";

// Общие заголовки ASP.NET ProblemDetails, которые не несут полезного текста —
// если пришли только они, пытаемся достать настоящее сообщение из errors/detail.
const GENERIC_TITLES = new Set([
  "Bad Request",
  "One or more validation errors occurred.",
  "An error occurred while processing your request.",
]);

/**
 * Достаёт человекочитаемое сообщение из ошибки axios.
 * Бэкенд возвращает ошибки в двух форматах:
 *  - бизнес-ошибки как простую строку, напр. BadRequest("Этот номер занят!");
 *  - framework-ошибки как ProblemDetails { title, detail, errors }.
 */
export const extractErrorMessage = (
  err: unknown,
  fallback = "Произошла ошибка"
): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;

    // 1) Простая строка в теле ответа.
    if (typeof data === "string" && data.trim()) return data.trim();

    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;

      // 2) Явное сообщение.
      const direct =
        (obj.message as string) ??
        (obj.Message as string) ??
        (obj.detail as string) ??
        (obj.error as string);
      if (typeof direct === "string" && direct.trim()) return direct.trim();

      // 3) ProblemDetails errors: { field: [msg] } или [msg].
      const errors = obj.errors;
      if (Array.isArray(errors)) {
        const first = errors.find((e) => typeof e === "string" && e.trim());
        if (typeof first === "string") return first.trim();
      } else if (errors && typeof errors === "object") {
        for (const value of Object.values(errors as Record<string, unknown>)) {
          if (Array.isArray(value) && typeof value[0] === "string")
            return value[0].trim();
          if (typeof value === "string" && value.trim()) return value.trim();
        }
      }

      // 4) В крайнем случае — title (если он осмысленный).
      const title = obj.title;
      if (
        typeof title === "string" &&
        title.trim() &&
        !GENERIC_TITLES.has(title.trim())
      ) {
        return title.trim();
      }
    }

    if (err.message) return err.message;
  }

  if (err instanceof Error) return err.message;
  return fallback;
};
