import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { allowedDomain, devBypassEnabled } from "@/lib/config";
import { getUser } from "@/lib/session";

export const metadata: Metadata = { title: "Đăng nhập" };

function safeNext(value: string | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target = safeNext(next);
  if (await getUser()) redirect(target);
  const bypass = devBypassEnabled();

  return (
    <div className="mx-auto max-w-sm space-y-5 py-10">
      <h1 className="text-2xl font-semibold">Đăng nhập</h1>
      <p className="text-sm text-muted">
        Chỉ dành cho tài khoản Google thuộc tên miền <strong>@{allowedDomain()}</strong>.
      </p>
      {error && (
        <p role="alert" className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          Không đăng nhập được. Hãy dùng đúng tài khoản công ty.
        </p>
      )}
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: target });
        }}
      >
        <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white">
          Đăng nhập bằng Google
        </button>
      </form>
      {bypass && (
        <form
          action={async (form: FormData) => {
            "use server";
            try {
              await signIn("dev", { email: String(form.get("email") ?? ""), redirectTo: target });
            } catch (e) {
              if (e instanceof AuthError) redirect("/login?error=1");
              throw e;
            }
          }}
          className="space-y-2 rounded-lg border border-dashed border-border p-3"
        >
          <p className="text-xs text-muted">Chế độ phát triển: đăng nhập giả lập</p>
          <input
            name="email"
            type="email"
            required
            placeholder={`ten@${allowedDomain()}`}
            aria-label="Email giả lập"
            className="w-full rounded border border-border bg-surface px-3 py-2"
          />
          <button type="submit" className="w-full rounded border border-border px-3 py-2 text-sm">
            Đăng nhập giả lập
          </button>
        </form>
      )}
    </div>
  );
}
