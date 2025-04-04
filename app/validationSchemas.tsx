import { z } from "zod";

export const customerSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, "Please enter a complete name.").max(255),
	shortname: z.string().max(32).optional(),
	shortName: z.string().max(32).optional(),
	email: z.string().email().max(255),
	defaultRate: z.number().positive(),
	color: z.string().max(7).nullable().optional(),
	paymentTerms: z.string().optional(),
});

export const timeLogSchema = z.object({
	customerId: z.number().nonnegative("Customer ID must be a non-negative number"),
	projectId: z.number().nonnegative("Project ID must be a non-negative number"),
	taskId: z.number().nonnegative("Task ID must be a non-negative number"),
	userId: z.number().nonnegative("User ID must be a non-negative number"),
	duration: z.number().nonnegative("Duration must be a non-negative number"),
	date: z.union([
		z.date(),
		z.string().refine((val) => !isNaN(Date.parse(val)), {
			message: "Expected date, received string",
		}),
	]),
	description: z.string().nullable().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	repeatInterval: z.number().nullable().optional(),
});

export const filterSchema = z.object({
	customerId: z.number().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	invoiceStatus: z.enum(["all", "invoiced", "not-invoiced"]).optional(),
});

export const projectSchema = z.object({
	id: z.number().optional(),
	customerId: z.number(),
	dateCreated: z.string().nullable().optional(),
	rate: z
		.union([z.string(), z.number()])
		.refine((value) => typeof value === "string" || typeof value === "number", {
			message: "Rate must be a string or number",
		})
		.transform((value) => {
			if (typeof value === "string") {
				return value ? parseFloat(value) : undefined;
			}
			return value;
		})
		.optional(),
	description: z.string().optional(),
	name: z.string().min(1, "Project name is required"),
	archived: z.boolean().optional(),
});

export const bookingSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1),
	email: z.string().email(),
	date: z.string().refine((val) => !isNaN(Date.parse(val)), {
		message: "Invalid date",
	}),
	startTime: z.string().refine(
		(val) => {
			const timeParts = val.split(":");
			return timeParts.length === 2 && !isNaN(Number(timeParts[0])) && !isNaN(Number(timeParts[1]));
		},
		{
			message: "Invalid start time",
		}
	),
	endTime: z.string().refine(
		(val) => {
			const timeParts = val.split(":");
			return timeParts.length === 2 && !isNaN(Number(timeParts[0])) && !isNaN(Number(timeParts[1]));
		},
		{
			message: "Invalid end time",
		}
	),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
});

// Shared fields for "sign-in" and "customer" types (if applicable)
const sharedFields = {
	email: z.string().email().min(5), // adjusted min length
	password: z.string().min(8), // remove optional() if not intended
};

// Extended fields for non-"sign-in" types
const extendedFields = {
	firstName: z.string().min(2).max(32),
	lastName: z.string().min(2).max(32),
	address: z.string().min(2).max(100),
	city: z.string().min(2).max(32),
	state: z.string().min(2).max(5), // adjusted max length for international support
	postalCode: z.string(),
	dob: z.string().max(10),
	role: z.string().max(10),
};

// SSN field with improved naming and optional chaining
const ssnField = {
	ssnLastFour: z.string().min(4).max(4).optional(),
};

// Type-specific schemas
export const authFormSchema = (type: string) =>
	z.object({
		...sharedFields,

		...(type !== "sign-in" ? extendedFields : {}),

		...ssnField, // include SSN field for all types, or conditionally if needed

		// password is optional only for "customer" type
		...(type === "customer" ? { password: z.string().min(8).optional() } : {}),
	});

export const profileFormSchema = () =>
	z.object({
		firstName: z.string().min(2).max(32),
		lastName: z.string().min(2).max(32),
		address: z.string().min(2).max(100),
		city: z.string().min(2).max(32),
		state: z.string().min(2).max(2),
		postalCode: z.string(),
		dob: z.string().max(10),
		role: z.string().max(10),
		ssn: z.string().min(4, "Should only be the last 4 digits of your SSN or TIN").max(4, "Should only be the last 4 digits of your SSN or TIN"),
		email: z.string().email().min(2, {
			message: "Email must be at least 2 characters.",
		}),
		password: z.string().min(8, "Password must be at least 8 characters"),
	});
