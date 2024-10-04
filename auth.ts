import NextAuth from "next-auth";
import { authOptions } from "./auth.config";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";

export const handler = NextAuth(authOptions);

export async function auth(...args: [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]] | [NextApiRequest, NextApiResponse] | []) {
	try {
		if (args.length === 0) {
			console.log("No request/response objects provided to auth function");
			return null;
		}
		const [req, res] = args as [NextApiRequest, NextApiResponse];
		const session = await getServerSession(req, res, authOptions);
		console.log("getServerSession result:", JSON.stringify(session, null, 2));

		if (!session) {
			const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
			console.log("getToken result:", JSON.stringify(token, null, 2));
			if (token) {
				return {
					user: {
						id: token.id as string,
						name: token.name as string,
						email: token.email as string,
					},
				};
			}
		}

		return session;
	} catch (error) {
		console.error("Error in auth function:", error);
		return null;
	}
}
