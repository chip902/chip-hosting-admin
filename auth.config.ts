import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma/client";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				console.log("Authorize function called with credentials:", credentials?.email);
				if (!credentials?.email || !credentials?.password) {
					throw new Error("Email and password are required");
				}

				const user = await prisma.user.findUnique({
					where: { email: credentials.email },
				});

				console.log("User found:", user ? "Yes" : "No");

				if (user && user.password && bcrypt.compareSync(credentials.password, user.password)) {
					console.log("Password verified, returning user");
					return {
						id: user.id.toString(),
						email: user.email,
						name: user.firstName || user.email,
					};
				} else {
					console.log("Authentication failed");
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			console.log("JWT callback called", { tokenId: token.id, userId: user?.id });
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.name = user.name;
			}
			console.log("JWT token after update:", token);
			return token;
		},
		async session({ session, token }) {
			console.log("Session callback called", { sessionUserId: session.user?.id, tokenId: token.id });
			if (session.user) {
				session.user.id = token.id as string;
				session.user.email = token.email as string;
				session.user.name = token.name as string | null;
			}
			console.log("Returning session:", JSON.stringify(session, null, 2));
			return session;
		},
	},
	pages: {
		signIn: "/auth/signin",
	},
	debug: true,
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
};
