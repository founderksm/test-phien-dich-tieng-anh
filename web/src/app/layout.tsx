import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { signOut } from "@/auth";
import { getUser } from "@/lib/session";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: { default: "KSMLOOK Phiên dịch", template: "%s · KSMLOOK Phiên dịch" },
  description: "Kho câu mẫu và thuật ngữ phiên dịch thương mại Việt – Anh – Trung của KSMLOOK",
  applicationName: "KSMLOOK Phiên dịch",
  appleWebApp: { capable: true, title: "Phiên dịch", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f5c4d",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();

  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href="/" className="font-semibold text-accent">
              KSMLOOK Phiên dịch
            </Link>
            {user && (
              <nav className="order-last flex basis-full flex-wrap items-center gap-x-4 gap-y-1 text-sm whitespace-nowrap sm:order-none sm:basis-auto sm:flex-1">
                <Link href="/" className="hover:text-accent">Tra cứu</Link>
                <Link href="/glossary" className="hover:text-accent">Thuật ngữ</Link>
                <Link href="/suggest" className="hover:text-accent">Đề xuất câu</Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="hover:text-accent">Duyệt</Link>
                )}
              </nav>
            )}
            {user && (
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
                className="ml-auto flex items-center gap-2 text-xs text-muted"
              >
                <span className="hidden sm:inline">{user.email}</span>
                <button type="submit" className="rounded border border-border px-2 py-1 hover:text-foreground">
                  Đăng xuất
                </button>
              </form>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-border py-4 text-center text-xs text-muted">
          KSMLOOK – Translation Knowledge Base
        </footer>
      </body>
    </html>
  );
}
