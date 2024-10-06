import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			firstName?: string | null;
			lastName?: string | null;
		} & DefaultSession["user"];
	}

	interface User {
		id: string;
		firstName?: string | null;
		lastName?: string | null;
		name?: string | null;
		email: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		firstName?: string | null;
		lastName?: string | null;
	}
}
