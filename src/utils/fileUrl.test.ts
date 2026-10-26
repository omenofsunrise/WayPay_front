import { describe, expect, it } from "vitest";
import { FILE_BASE_URL } from "../api/client";
import { getFileUrl } from "./fileUrl";

describe("getFileUrl", () => {
  it("builds a file-server URL from a relative path", () => {
    const base = (FILE_BASE_URL || "").replace(/\/+$/, "");

    expect(getFileUrl("/waypay-core/employees/1/photo.jpg")).toBe(
      `${base}/waypay-core/employees/1/photo.jpg`
    );
  });

  it("keeps an absolute URL unchanged", () => {
    const url = "https://file.waypay.one/waypay-core/photo.jpg";

    expect(getFileUrl(url)).toBe(url);
  });

  it("adds a stable version query parameter", () => {
    expect(getFileUrl("https://file.waypay.one/photo.jpg", 123)).toBe(
      "https://file.waypay.one/photo.jpg?v=123"
    );
  });

  it("appends the version to an existing query string", () => {
    expect(getFileUrl("https://file.waypay.one/photo.jpg?size=large", 123)).toBe(
      "https://file.waypay.one/photo.jpg?size=large&v=123"
    );
  });
});
