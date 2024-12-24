import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma/client";
import bcrypt from "bcryptjs";
import { User } from "@/types/index";

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
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					const user = await prisma.user.findUnique({ where: { email: credentials.email } });
					if (!user || !user.password) {
						return null; // User not found or no password hash
					}

					// Compare the provided password with the hashed password in the database
					const isValidPassword = await bcrypt.compare(credentials.password, user.password);

					if (isValidPassword) {
						return {
							id: user.id,
							userId: user.userId,
							name: user.firstName ?? "Guest",
							email: user.email,
							firstName: user.firstName,
							lastName: user.lastName,
							dwollaCustomerUrl: user.dwollaCustomerUrl,
							dwollaCustomerId: user.dwollaCustomerId,
						};
					}
				} catch (error) {
					console.error("Error finding user:", error);
				}

				return null;
			},
		}),
	],
	session: {
		strategy: "jwt",
	},
	callbacks: {
		jwt({ token, user }) {
			if (user) {
				token.firstName = user.firstName;
				token.lastName = user.lastName;
				token.dwollaCustomerUrl = user.dwollaCustomerUrl;
				token.dwollaCustomerId = user.dwollaCustomerId;
			}
			return token;
		},
		session({ session, token }) {
			if (session.user) {
				session.user.firstName = token.firstName as string;
				session.user.lastName = token.lastName as string;
				session.user.dwollaCustomerUrl = token.dwollaCustomerUrl as string;
				session.user.dwollaCustomerId = token.dwollaCustomerId as string;
			}
			return session;
		},
	},
};

export default authOptions;
