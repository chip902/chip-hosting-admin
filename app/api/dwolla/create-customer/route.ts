// /app/api/dwolla/create-customer/route.ts

import { NextRequest, NextResponse } from "next/server";
import dwollaClient from "@/lib/dwolla";
import prisma from "@/prisma/client";
import { User } from "@prisma/client";

export async function POST(request: NextRequest) {
	try {
		const { user } = await request.json();
		console.log("Dwolla Create Customer API User Object received:", user);
		const customerData = {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			type: "personal", // added field with default value
			address1: user.address || "Default Address",
			city: user.city || "Default City",
			state: user.state || "NY",
			postalCode: user.postalCode || "10001",
			dateOfBirth: user.dob || "1980-01-01",
			ssn: user.ssn || "6789",
		};
		console.log("Dwolla Customer Data:", customerData);

		const response = await dwollaClient.post("customers", customerData);
		const customerUrl = response.headers.get("location");
		const dwollaCustomerId = response.body.id;

		await updateUserDwollaCustomerId(parseInt(user.id, 10), customerUrl as string, dwollaCustomerId);

		return NextResponse.json({ dwollaCustomerId }, { status: 201 });
	} catch (error) {
		console.error("Error creating Dwolla customer: ", error);
		if (typeof error === "object" && error !== null && "response" in error) {
			const response = error.response;
			if (typeof response === "object" && response !== null && "body" in response) {
				console.error("Dwolla Error Details:", response.body);
			} else {
				console.error("Unexpected error structure for 'error.response': ", response);
			}
		} else {
			console.error("Unexpected error structure for 'error': ", error);
		}
		return NextResponse.json({ error: "Error creating Dwolla customer" }, { status: 500 });
	}
}

export async function updateUserDwollaCustomerId(userId: User["id"], dwollaCustomerUrl: string, dwollaCustomerId: string): Promise<User> {
	return prisma.user.update({
		where: { id: userId },
		data: { dwollaCustomerUrl, dwollaCustomerId },
	});
}
