import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { getParamsFromUrl } from "@/lib/utils";

export async function GET(request: Request) {
	const { params } = getParamsFromUrl(request.url);
	const { id } = params;

	if (!id) {
		return NextResponse.json({ error: "Invalid or missing id" }, { status: 400 });
	}

	try {
		const booking = await prisma.booking.findUnique({
			where: { id: Number(id) },
		});

		if (!booking) {
			return NextResponse.json({ error: "Booking not found" }, { status: 404 });
		}

		return NextResponse.json(booking, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	const { params } = getParamsFromUrl(request.url);
	const { id } = params;

	if (!id) {
		return NextResponse.json({ error: "Invalid or missing id" }, { status: 400 });
	}

	try {
		await prisma.booking.delete({
			where: { id: Number(id) },
		});
		return new Response(null, { status: 204 });
	} catch (error) {
		return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
	}
}
