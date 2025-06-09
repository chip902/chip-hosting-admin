// /auth.config.ts
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma/client";

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},

			async authorize(credentials): Promise<User | null> {
				console.log("Received Credentials: ", credentials);

				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					const user = await prisma.user.findUnique({
						where: { email: credentials.email },
					});

					if (!user || !user.password) {
						console.log("CHIP DEBUG: USER OBJECT EMPTY");
						return null;
					}

					const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

					if (!isPasswordValid) {
						console.log("CHIP DEBUG: PASSWORD INVALID");
						return null;
					}

					return {
						id: user.id,
						userId: user.userId || "",
						email: user.email,
						name: user.firstName || user.email,
						firstName: user.firstName || null,
						lastName: user.lastName || null,
					};
				} catch (error) {
					console.error("Auth error:", error);
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				console.log("JWT Callback - User: ", user);
				token.id = user.id.toString();
				token.userId = user.userId;
				token.name = user.name;
				token.firstName = user.firstName;
				token.lastName = user.lastName;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				console.log("Session Callback - Token: ", token);
				session.user.id = token.id;
				session.user.userId = token.userId;
				session.user.name = token.name;
				session.user.firstName = token.firstName;
				session.user.lastName = token.lastName;
			}
			return session;
		},
	},
	pages: {
		signIn: "/sign-in",
		signOut: "/auth/sign-out",
	},
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: "jwt",
	},
	debug: process.env.NODE_ENV === "development",
};
