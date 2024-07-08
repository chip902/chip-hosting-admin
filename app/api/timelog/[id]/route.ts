import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";

// Update a time entry
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const body = await request.json();
		const id = parseInt(params.id);
		const { description, duration, ...rest } = body;
		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}
		const updatedEntry = await prisma.timeEntry.update({
			where: { id },
			data: {
				...rest,
				id: id,
				duration: duration,
				description: description,
			},
		});

		return NextResponse.json(updatedEntry, { status: 200 });
	} catch (error) {
		console.error("Error updating time entry:", error);
		return NextResponse.json({ error: "Error updating time entry" }, { status: 500 });
	}
}

// Delete a time entry
export async function DELETE(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const id = parseInt(url.pathname.split("/").pop() || "");

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

		await prisma.timeEntry.delete({
			where: { id },
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting time entry:", error);
		return NextResponse.json({ error: "Error deleting time entry" }, { status: 500 });
	}
}
