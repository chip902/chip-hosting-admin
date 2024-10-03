// /app/api/user/new-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { authFormSchema } from "@/app/validationSchemas";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = authFormSchema(body.type).safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json({ message: "Missing fields" }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await prisma.user.create({
			data: {
				firstName: body.firstname,
				lastName: body.lastName,
				email: body.email,
				address: body.address,
				city: body.city,
				postalCode: body.postalCode,
				dob: body.dob,
				ssn: body.ssn,
				password: hashedPassword,
			},
		});
		return NextResponse.json(newUser, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error creating user" }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = authFormSchema(body.type).safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json({ message: "Missing fields" }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const updatedUser = await prisma.user.update({
			where: { id: body.id },
			data: {
				firstName: body.firstname,
				lastName: body.lastName,
				email: body.email,
				address: body.address,
				city: body.city,
				postalCode: body.postalCode,
				dob: body.dob,
				ssn: body.ssn,
				password: hashedPassword,
			},
		});
		return NextResponse.json(updatedUser, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error updating user" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const users = await prisma.user.findMany();
		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching users..." }, { status: 500 });
	}
}
