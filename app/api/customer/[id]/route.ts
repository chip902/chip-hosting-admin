import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";

// export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
// 	const body = await request.json();

// 	const { assignedToUserId, title, description } = body;
// 	if (assignedToUserId) {
// 		const user = await prisma.user.findUnique({
// 			where: { id: assignedToUserId },
// 		});
// 		if (!user) NextResponse.json({ error: "Invalid User" }, { status: 400 });
// 	}

// 	const issue = await prisma.issue.findUnique({
// 		where: { id: parseInt(params.id) },
// 	});
// 	if (!issue) {
// 		NextResponse.json({ error: "Invalid Issues or Not Found" }, { status: 404 });
// 	}
// 	const updatedIssue = await prisma.issue.update({
// 		where: { id: issue?.id },
// 		data: {
// 			title,
// 			description,
// 			assignedToUserId,
// 		},
// 	});
// 	return NextResponse.json(updatedIssue);
// }

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	const customer = await prisma.customer.findUnique({
		where: { id: parseInt(params.id) },
	});
	if (!customer) return NextResponse.json({ error: "Invalid customer..." }, { status: 404 });
	await prisma.customer.delete({
		where: { id: parseInt(params.id) },
	});
	return NextResponse.json({ message: "Customer deleted." }, { status: 201 });
}
