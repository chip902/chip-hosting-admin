import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

type Params = {
	params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const payload = await getPayload({ config });

		const result = await payload.delete({
			collection: "media",
			id,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Media DELETE error:", error);
		return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
	}
}
