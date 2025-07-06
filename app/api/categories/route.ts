import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../payload.config.mjs";

export async function GET() {
	try {
		const payload = await getPayload({ config });

		const result = await payload.find({
			collection: "categories",
			limit: 100,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Categories GET error:", error);
		return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const payload = await getPayload({ config });

		const result = await payload.create({
			collection: "categories",
			data: body,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Categories POST error:", error);
		return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
	}
}
