import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { i18n } from "./i18n-config";

import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

function getLocale(request: NextRequest): string | undefined {
    // Negotiator expects plain object so we need to transform headers
    const negotiatorHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

    const locales = Array.from(i18n.locales);

    // Use negotiator and intl-localematcher to get best locale
    const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
        locales,
    );

    const locale = matchLocale(languages, locales, i18n.defaultLocale);

    return locale;
}

export function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    console.log("[MIDDLEWARE] incoming request for pathname:", pathname);

    if (
        pathname.startsWith('/.next/') ||             // Next build
        pathname.startsWith('/_next/data/') ||        // RSC Payloads
        pathname.startsWith('/_rsc/') ||              // React Server Components
        pathname === '/' ||                           // Root
        pathname.includes('.') ||                     // Static files
        request.headers.get('x-middleware-preflight') // Preflight requests
    ) {
        return NextResponse.next();
    }

    // Check if there is any supported locale in the pathname
    const pathnameIsMissingLocale = i18n.locales.every(locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`);
    console.log("[MIDDLEWARE] pathnameIsMissingLocale:", pathnameIsMissingLocale);

    // Redirect if there is no locale
    if (pathnameIsMissingLocale) {
        console.log("[MIDDLEWARE] No locale found in pathname. Determining locale from request...");
        const locale = getLocale(request);

        // e.g. incoming request is /employee
        // The new URL is now /en/employee
        return NextResponse.redirect(
            new URL(
                `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
                request.url,
            ),
        );
    }
    return NextResponse.next();
}

export const config = {
    // Matcher ignoring `/_next/` and `/api/`
    matcher: [
        '/((?!api|_next/static|_next/image|_next/data|.next|_rsc|favicon.ico|payroll-logo.jpg).*)',
    ],
};