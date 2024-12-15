// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { bookingSchema } from "@/app/validationSchemas";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		console.log("Request Body:", body); // Log the received request body

		const validation = bookingSchema.safeParse(body);
		console.log("Validation Result:", validation); // Log the result of the validation

		if (!validation.success) {
			console.log("Validation Error:", validation.error.format()); // Log validation errors
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { name, email, date, startTime, endTime } = body;

		const newBooking = await prisma.booking.create({
			data: {
				name,
				email,
				date: new Date(date),
				startTime: new Date(`${date}T${startTime}:00Z`),
				endTime: new Date(`${date}T${endTime}:00Z`),
			},
		});
		console.log("New Booking:", newBooking); // Log the newly created booking

		return NextResponse.json(newBooking, { status: 201 });
	} catch (error) {
		console.error("Error Creating Booking:", error); // Log any errors encountered
		return NextResponse.json({ error: "Error creating booking" }, { status: 500 });
	}
}

export async function GET(req: NextRequest) {
	try {
		const booking = await prisma.booking.findMany();

		return NextResponse.json({ booking }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching bookings..." }, { status: 500 });
	}
}
