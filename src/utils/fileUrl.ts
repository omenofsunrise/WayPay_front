import { FILE_BASE_URL } from "../api/client";

export const getFileUrl = (
  filePath?: string | null,
  version?: string | number
): string | null => {
  if (!filePath) return null;

  const url = /^(https?:\/\/|blob:|data:)/i.test(filePath)
    ? filePath
    : `${(FILE_BASE_URL || "").replace(/\/+$/, "")}/${filePath.replace(
        /^\/+/,
        ""
      )}`;

  if (version === undefined) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(String(version))}`;
};
