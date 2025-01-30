import {clerkMiddleware, createRouteMatcher} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";

const isProtectedRoute = createRouteMatcher(["/feed", "/upload", "/profile"]);

export default clerkMiddleware(async (auth, req) => {
    const {userId, sessionClaims, redirectToSignIn} = await auth();
    if (!userId && isProtectedRoute(req)) {
        return redirectToSignIn({returnBackUrl: req.url})
    }

    if (userId &&
        !sessionClaims?.metadata?.onboardingComplete &&
        req.nextUrl.pathname !== '/onboarding'
    ) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
    }

    if (userId && isProtectedRoute(req)) {
        return NextResponse.next()
    }

});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/"],
};