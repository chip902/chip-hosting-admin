// types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
	interface User extends DefaultUser {
		id: number;
<<<<<<< HEAD
		userId: string | null;
=======
		userId: string;
>>>>>>> 671938d (Banking-feature (#3))
		email: string;
		dwollaCustomerUrl?: string | null;
		dwollaCustomerId?: string | null;
		firstName?: string | null;
		lastName?: string | null;
		createdAt?: Date | null;
		updatedAt?: Date | null;
	}

	interface Session {
		user: {
			id: string;
<<<<<<< HEAD
			userId: string | null;
=======
			userId: string;
>>>>>>> 671938d (Banking-feature (#3))
			dwollaCustomerUrl?: string | null;
			dwollaCustomerId?: string | null;
			firstName?: string | null;
			lastName?: string | null;
		} & DefaultSession["user"];
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		userId: string;
		dwollaCustomerUrl?: string | null;
		dwollaCustomerId?: string | null;
		firstName?: string | null;
		lastName?: string | null;
	}
}
