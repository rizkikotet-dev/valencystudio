export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/((?!login|_next|api/auth|favicon.ico|logo.svg).*)"],
};
