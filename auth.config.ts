import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma/client";
import bcrypt from "bcryptjs";
import { User } from "next-auth";

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
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					const user = await prisma.user.findUnique({
						where: { email: credentials.email },
					});

					if (!user || !user.password) {
						return null;
					}

					const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

					if (!isPasswordValid) {
						return null;
					}

					return {
						id: user.id.toString(),
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
				token.id = user.id;
				token.email = user.email;
				token.name = user.name;
				token.firstName = user.firstName;
				token.lastName = user.lastName;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.email = token.email as string;
				session.user.name = token.name as string | null;
				session.user.firstName = token.firstName as string | null;
				session.user.lastName = token.lastName as string | null;
			}
			return session;
		},
	},
	pages: {
		signIn: "/auth/sign-in",
		signOut: "/auth/sign-out",
	},
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: "jwt",
	},
	debug: process.env.NODE_ENV === "development",
};
