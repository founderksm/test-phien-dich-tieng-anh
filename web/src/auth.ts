import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { allowedDomain, devBypassEnabled, isAllowedEmail, roleFor } from "@/lib/config";

declare module "next-auth" {
  interface Session {
    user: { role: "admin" | "editor" } & DefaultSession["user"];
  }
}

const providers = [
  Google({
    authorization: { params: { hd: allowedDomain(), prompt: "select_account" } },
  }),
];

if (devBypassEnabled()) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev",
      credentials: { email: { label: "Email", type: "email" } },
      authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        return isAllowedEmail(email) ? { id: email, email, name: email.split("@")[0] } : null;
      },
    }) as never,
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  callbacks: {
    signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true && isAllowedEmail(profile.email);
      }
      return account?.provider === "dev" && isAllowedEmail(user.email);
    },
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      const email = typeof token.email === "string" ? token.email : "";
      if (session.user && email) session.user.role = roleFor(email);
      return session;
    },
  },
});
