// /app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma/client";
import bcrypt from "bcryptjs";

const authOptions: NextAuthOptions = {
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
					throw new Error("Email and password are required");
				}

				const user = await prisma.user.findUnique({
					where: { email: credentials.email },
				});

				if (user && user.password && bcrypt.compareSync(credentials.password, user.password)) {
					const nextAuthUser: User = {
						id: user.id.toString(),
						email: user.email,
					};
					return nextAuthUser;
				} else {
					throw new Error("Invalid email or password");
				}
			},
		}),
	],
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
