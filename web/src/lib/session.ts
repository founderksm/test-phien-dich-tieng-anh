import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAllowedEmail } from "@/lib/config";

export interface AppUser {
  email: string;
  name: string;
  role: "admin" | "editor";
}

export async function getUser(): Promise<AppUser | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!session?.user || !isAllowedEmail(email)) return null;
  return {
    email: email.toLowerCase(),
    name: session.user.name ?? email.split("@")[0],
    role: session.user.role,
  };
}

export async function requireUser(): Promise<AppUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
