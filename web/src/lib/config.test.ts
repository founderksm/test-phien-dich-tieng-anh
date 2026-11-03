import { afterEach, describe, expect, it, vi } from "vitest";
import { devBypassEnabled, isAllowedEmail, roleFor } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("isAllowedEmail", () => {
  it("chỉ chấp nhận đúng tên miền", () => {
    expect(isAllowedEmail("an@ksmlook.vn")).toBe(true);
    expect(isAllowedEmail("An@KSMLOOK.VN")).toBe(true);
    expect(isAllowedEmail("an@gmail.com")).toBe(false);
    expect(isAllowedEmail("an@ksmlook.vn.evil.com")).toBe(false);
    expect(isAllowedEmail("an@evilksmlook.vn")).toBe(false);
    expect(isAllowedEmail("ksmlook.vn")).toBe(false);
    expect(isAllowedEmail("")).toBe(false);
    expect(isAllowedEmail(null)).toBe(false);
  });

  it("tên miền cấu hình được", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAIN", "example.com");
    expect(isAllowedEmail("a@example.com")).toBe(true);
    expect(isAllowedEmail("a@ksmlook.vn")).toBe(false);
  });
});

describe("roleFor", () => {
  it("admin theo danh sách ADMIN_EMAILS, không phân biệt hoa thường", () => {
    vi.stubEnv("ADMIN_EMAILS", " Boss@ksmlook.vn , cfo@ksmlook.vn ");
    expect(roleFor("boss@ksmlook.vn")).toBe("admin");
    expect(roleFor("CFO@ksmlook.vn")).toBe("admin");
    expect(roleFor("staff@ksmlook.vn")).toBe("editor");
  });

  it("không có danh sách thì không ai là admin", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(roleFor("boss@ksmlook.vn")).toBe("editor");
  });
});

describe("devBypassEnabled", () => {
  it("cấm bật bypass ở production", () => {
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => devBypassEnabled()).toThrow();
  });

  it("bật được ở môi trường phát triển", () => {
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    vi.stubEnv("NODE_ENV", "development");
    expect(devBypassEnabled()).toBe(true);
  });
});
