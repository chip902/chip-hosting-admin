<<<<<<< HEAD
import type { NextAuthOptions } from "next-auth";
=======
import type { NextAuthOptions, User } from "next-auth";
>>>>>>> 671938d (Banking-feature (#3))
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma/client";
import bcrypt from "bcryptjs";
<<<<<<< HEAD
import { User } from "@/types/index";
=======
>>>>>>> 671938d (Banking-feature (#3))

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
<<<<<<< HEAD
			async authorize(credentials) {
=======
			async authorize(credentials): Promise<User | null> {
>>>>>>> 671938d (Banking-feature (#3))
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
<<<<<<< HEAD
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
=======
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
						id: user.id,
						userId: user.userId || "",
						dwollaCustomerUrl: user.dwollaCustomerUrl || null,
						dwollaCustomerId: user.dwollaCustomerId || null,
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
				token.dwollaCustomerUrl = user.dwollaCustomerUrl;
				token.dwollaCustomerId = user.dwollaCustomerId;
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
				session.user.dwollaCustomerUrl = token.dwollaCustomerUrl;
				session.user.dwollaCustomerId = token.dwollaCustomerId;
				session.user.name = token.name;
				session.user.firstName = token.firstName;
				session.user.lastName = token.lastName;
>>>>>>> 671938d (Banking-feature (#3))
			}
			return session;
		},
	},
<<<<<<< HEAD
};

export default authOptions;
=======
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
>>>>>>> 671938d (Banking-feature (#3))
