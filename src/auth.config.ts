import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const userRole = (auth?.user as any)?.role;

            const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
            const isPublicRoute = ["/login", "/", "/ronda"].some(path =>
                nextUrl.pathname === path || (path !== "/" && nextUrl.pathname.startsWith(path))
            );

            if (isApiAuthRoute) return true;

            if (!isLoggedIn) {
                return isPublicRoute;
            }

            // Role-based protection
            if (nextUrl.pathname.startsWith("/mozo") && userRole !== "MOZO" && userRole !== "ADMIN") {
                return false;
            }

            if (nextUrl.pathname.startsWith("/kds") && !["BARMAN", "COCINERO", "ADMIN"].includes(userRole)) {
                return false;
            }

            if (nextUrl.pathname.startsWith("/admin") && userRole !== "ADMIN") {
                return false;
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id as string;
            }
            return session;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
