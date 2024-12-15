// app/api/user/route.ts
import { NextResponse } from "next/server";
import prisma from "@/prisma/client";
export async function GET(request: Request) {
	try {
		// This is a placeholder for your actual data fetching logic.
		// In a real application, this might involve a database query or an external API call.

		const user = await prisma.user.findUnique({
			where: {},
		});

		return NextResponse.json(user);
	} catch (error) {
		console.error("Error fetching user:", error);
		return new Response(JSON.stringify({ error: "Failed to fetch user" }), {
			status: 500,
		});
	}
}
