import type { NextAuthConfig } from "next-auth";

function getRoleHomePage(role: string | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MOZO":
      return "/mozo";
    case "BARMAN":
      return "/barra/kds";
    case "COCINERO":
      return "/cocina/kds";
    default:
      return "/login";
  }
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = (auth?.user as any)?.role;

      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isPublicRoute =
        ["/login", "/"].includes(nextUrl.pathname) ||
        nextUrl.pathname.startsWith("/ronda/");

      if (isApiAuthRoute) return true;

      // Not logged in - only allow public routes
      if (!isLoggedIn) {
        return isPublicRoute;
      }

      // Logged in and trying to access login - redirect to role home
      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL(getRoleHomePage(userRole), nextUrl));
      }

      // Role-based route protection
      if (nextUrl.pathname.startsWith("/admin") && userRole !== "ADMIN") {
        return Response.redirect(new URL(getRoleHomePage(userRole), nextUrl));
      }

      if (
        nextUrl.pathname.startsWith("/mozo") &&
        !["MOZO", "ADMIN"].includes(userRole || "")
      ) {
        return Response.redirect(new URL(getRoleHomePage(userRole), nextUrl));
      }

      if (
        nextUrl.pathname.startsWith("/barra") &&
        !["BARMAN", "ADMIN"].includes(userRole || "")
      ) {
        return Response.redirect(new URL(getRoleHomePage(userRole), nextUrl));
      }

      if (
        nextUrl.pathname.startsWith("/cocina") &&
        !["COCINERO", "ADMIN"].includes(userRole || "")
      ) {
        return Response.redirect(new URL(getRoleHomePage(userRole), nextUrl));
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
