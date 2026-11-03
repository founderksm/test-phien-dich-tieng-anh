export function allowedDomain(): string {
  return (process.env.ALLOWED_EMAIL_DOMAIN ?? "ksmlook.vn").toLowerCase();
}

export function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const lower = email.toLowerCase();
  const at = lower.lastIndexOf("@");
  return at > 0 && lower.slice(at + 1) === allowedDomain();
}

export function roleFor(email: string): "admin" | "editor" {
  return adminEmails().has(email.toLowerCase()) ? "admin" : "editor";
}

export function devBypassEnabled(): boolean {
  const enabled = process.env.DEV_AUTH_BYPASS === "1";
  if (enabled && process.env.NODE_ENV === "production") {
    throw new Error("DEV_AUTH_BYPASS không được bật ở production");
  }
  return enabled;
}
