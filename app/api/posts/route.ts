import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../payload.config.mjs";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "10");
		const depth = parseInt(searchParams.get("depth") || "0");

		const payload = await getPayload({ config });

		const result = await payload.find({
			collection: "posts",
			limit,
			depth,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Posts GET error:", error);
		return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const payload = await getPayload({ config });

		const result = await payload.create({
			collection: "posts",
			data: body,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Posts POST error:", error);
		return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
	}
}
