import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLogin = pathname === "/admin/login"
  const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (!authed && !isLogin) {
    const url = new URL("/admin/login", request.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (authed && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/admin/:path*",
}
