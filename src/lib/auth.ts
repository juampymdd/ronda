import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    console.log("[auth] authorize attempt for:", credentials.email);

                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string },
                    });

                    if (!user) {
                        console.log("[auth] user not found:", credentials.email);
                        return null;
                    }
                    if (!user.password) {
                        console.log("[auth] user has no password:", credentials.email);
                        return null;
                    }

                    const isValid = await bcrypt.compare(credentials.password as string, user.password);
                    console.log("[auth] password valid:", isValid);

                    if (!isValid) return null;

                    console.log("[auth] login success for:", user.email, "role:", user.role);
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("[auth] authorize error:", error);
                    return null;
                }
            },
        }),
    ],
});
