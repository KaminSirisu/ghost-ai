import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function getPathFromEnv(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

const signInPath = getPathFromEnv(
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  "/sign-in"
);
const signUpPath = getPathFromEnv(
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  "/sign-up"
);

const isPublicRoute = createRouteMatcher([
  signInPath,
  `${signInPath}(.*)`,
  signUpPath,
  `${signUpPath}(.*)`,
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname === "/") {
    const { userId } = await auth();
    return NextResponse.redirect(new URL(userId ? "/editor" : signInPath, request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
