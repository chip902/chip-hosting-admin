// types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
	interface User extends DefaultUser {
		id: number;
		email: string;
		userId?: string | null;
		firstName?: string | null;
		lastName?: string | null;
		createdAt?: Date | null;
		updatedAt?: Date | null;
	}

	interface Session {
		user: {
			id: string;
			userId?: string | null;
			firstName?: string | null;
			lastName?: string | null;
		} & DefaultSession["user"];
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		userId?: string | null;
		firstName?: string | null;
		lastName?: string | null;
	}
}
