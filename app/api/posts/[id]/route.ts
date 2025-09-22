import config from "@/payload.config";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

type Params = {
	params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const payload = await getPayload({ config });

		const result = await payload.findByID({
			collection: "posts",
			id,
			depth: 2, // Include related data like category
		});

		if (!result) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("Posts GET error:", error);
		return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const body = await request.json();
		const payload = await getPayload({ config });

		const result = await payload.update({
			collection: "posts",
			id,
			data: body,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Posts PATCH error:", error);
		return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const payload = await getPayload({ config });

		const result = await payload.delete({
			collection: "posts",
			id,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Posts DELETE error:", error);
		return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
	}
}
