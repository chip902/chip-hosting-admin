import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../../payload.config.mjs";

type Params = {
	params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const body = await request.json();
		const payload = await getPayload({ config });

		const result = await payload.update({
			collection: "categories",
			id,
			data: body,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Categories PATCH error:", error);
		return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const payload = await getPayload({ config });

		const result = await payload.delete({
			collection: "categories",
			id,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Categories DELETE error:", error);
		return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
	}
}
