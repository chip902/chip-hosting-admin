import NextAuth from "next-auth";
import { authOptions } from "./auth.config";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

export const handler = NextAuth(authOptions);

export async function auth(...args: [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]] | [NextApiRequest, NextApiResponse] | []) {
	if (args.length === 0) {
		return null;
	}
	const [req, res] = args as [NextApiRequest, NextApiResponse];
	return getServerSession(req, res, authOptions);
}
