import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((request) => {
  if (request.auth?.user) return NextResponse.next();
  const url = new URL("/login", request.nextUrl.origin);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-|apple-icon|sw.js|robots.txt).*)",
  ],
};
