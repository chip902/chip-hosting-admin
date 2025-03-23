import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import qs from "query-string";
import { AccountTypes, CategoryCount, RawTimeEntry, Transaction } from "@/types";
import { differenceInMinutes, startOfDay } from "date-fns";
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export const formatTime = (time: string): string => {
	// Format time as needed
	return new Date(time).toLocaleTimeString();
};

export const calculateStartSlot = (startTime: Date) => {
	const startOfDayDate = startOfDay(startTime);
	const minutesFromDayStart = differenceInMinutes(startTime, startOfDayDate);
	return Math.floor(minutesFromDayStart / 60); // Each hour has 60 slots
};

// FORMAT DATE TIME
export const formatDateTime = (dateString: Date) => {
	const dateTimeOptions: Intl.DateTimeFormatOptions = {
		weekday: "short", // abbreviated weekday name (e.g., 'Mon')
		month: "short", // abbreviated month name (e.g., 'Oct')
		day: "numeric", // numeric day of the month (e.g., '25')
		hour: "numeric", // numeric hour (e.g., '8')
		minute: "numeric", // numeric minute (e.g., '30')
		hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
	};

	const dateDayOptions: Intl.DateTimeFormatOptions = {
		weekday: "short", // abbreviated weekday name (e.g., 'Mon')
		year: "numeric", // numeric year (e.g., '2023')
		month: "2-digit", // abbreviated month name (e.g., 'Oct')
		day: "2-digit", // numeric day of the month (e.g., '25')
	};

	const dateOptions: Intl.DateTimeFormatOptions = {
		month: "short", // abbreviated month name (e.g., 'Oct')
		year: "numeric", // numeric year (e.g., '2023')
		day: "numeric", // numeric day of the month (e.g., '25')
	};

	const timeOptions: Intl.DateTimeFormatOptions = {
		hour: "numeric", // numeric hour (e.g., '8')
		minute: "numeric", // numeric minute (e.g., '30')
		hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
	};

	const formattedDateTime: string = new Date(dateString).toLocaleString("en-US", dateTimeOptions);

	const formattedDateDay: string = new Date(dateString).toLocaleString("en-US", dateDayOptions);

	const formattedDate: string = new Date(dateString).toLocaleString("en-US", dateOptions);

	const formattedTime: string = new Date(dateString).toLocaleString("en-US", timeOptions);

	return {
		dateTime: formattedDateTime,
		dateDay: formattedDateDay,
		dateOnly: formattedDate,
		timeOnly: formattedTime,
	};
};

export function formatAmount(amount: number): string {
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	});

	return formatter.format(amount);
}

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));

export const removeSpecialCharacters = (value: string) => {
	return value.replace(/[^\w\s]/gi, "");
};

interface UrlQueryParams {
	params: string;
	key: string;
	value: string;
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
	const currentUrl = qs.parse(params);

	currentUrl[key] = value;

	return qs.stringifyUrl(
		{
			url: window.location.pathname,
			query: currentUrl,
		},
		{ skipNull: true }
	);
}

export function getAccountTypeColors(type: AccountTypes) {
	switch (type) {
		case "depository":
			return {
				bg: "bg-blue-25",
				lightBg: "bg-blue-100",
				title: "text-blue-900",
				subText: "text-blue-700",
			};

		case "credit":
			return {
				bg: "bg-success-25",
				lightBg: "bg-success-100",
				title: "text-success-900",
				subText: "text-success-700",
			};

		default:
			return {
				bg: "bg-green-25",
				lightBg: "bg-green-100",
				title: "text-green-900",
				subText: "text-green-700",
			};
	}
}

export function countTransactionCategories(transactions: Transaction[]): CategoryCount[] {
	const categoryCounts: { [category: string]: number } = {};
	let totalCount = 0;

	// Iterate over each transaction
	transactions &&
		transactions.forEach((transaction) => {
			// Extract the category from the transaction
			const category = transaction.category as string;

			// If the category exists in the categoryCounts object, increment its count
			if (categoryCounts.hasOwnProperty(category)) {
				categoryCounts[category]++;
			} else {
				// Otherwise, initialize the count to 1
				categoryCounts[category] = 1;
			}

			// Increment total count
			totalCount++;
		});

	// Convert the categoryCounts object to an array of objects
	const aggregatedCategories: CategoryCount[] = Object.keys(categoryCounts).map((category) => ({
		name: category,
		count: categoryCounts[category],
		totalCount,
	}));

	// Sort the aggregatedCategories array by count in descending order
	aggregatedCategories.sort((a, b) => b.count - a.count);

	return aggregatedCategories;
}

export function extractCustomerIdFromUrl(url: string) {
	// Split the URL string by '/'
	const parts = url.split("/");

	// Extract the last part, which represents the customer ID
	const customerId = parts[parts.length - 1];

	return customerId;
}

export function encryptId(id: string) {
	return btoa(id);
}

export function decryptId(id: string) {
	return atob(id);
}

export const getTransactionStatus = (date: Date) => {
	const today = new Date();
	const twoDaysAgo = new Date(today);
	twoDaysAgo.setDate(today.getDate() - 2);

	return date > twoDaysAgo ? "Processing" : "Success";
};

export function getParamsFromUrl(url: string): { params: { id: string } } {
	const segments = url.split("/");
	const possiblyId = segments[segments.length - 1];

	// Ensure that `id` is a string and not empty, otherwise provide a default value (e.g., an empty string)
	const id = typeof possiblyId === "string" && possiblyId.trim() !== "" ? possiblyId : "";

	return { params: { id } };
}

/**
 * Calculate the duration of a time entry in minutes
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
	if (!startTime || !endTime) return 60; // Default to 1 hour if times are missing

	try {
		const start = new Date(startTime);
		const end = new Date(endTime);
		const duration = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60)); // Duration in minutes

		// Return a minimum of 60 minutes (1 hour) if the calculated duration is less
		return Math.max(60, duration);
	} catch (error) {
		console.error("Error calculating duration:", error);
		return 60; // Default to 1 hour on error
	}
};

/**
 * Calculate width for a time entry based on overlapping entries
 * Default to 100% width if no other calculation is provided
 */
export const calculateWidth = (entry: any): number => {
	// This could be expanded to consider other entries that overlap
	// For now, default to 100% (1.0)
	return entry.width || 1.0;
};

/**
 * Calculate left position (horizontal offset) for a time entry
 * Default to 0 (aligned to left) if no other calculation is provided
 */
export const calculateLeftPosition = (entry: any): number => {
	// This could be expanded to position entries side by side if they overlap
	// For now, default to 0 (left aligned)
	return entry.left || 0;
};

/**
 * Convert a date to local time zone
 * This helps with timezone differences between server and client
 */
export const toLocalTime = (dateStr: string): Date => {
	if (!dateStr) return new Date();

	try {
		// If the date string already includes timezone info, use it as is
		const date = new Date(dateStr);

		// Ensure valid date
		if (isNaN(date.getTime())) {
			throw new Error("Invalid date");
		}

		return date;
	} catch (error) {
		console.error("Error converting to local time:", error);
		return new Date();
	}
};

/**
 * Format a date to time string in 12-hour format
 */
export const formatTimeDisplay = (date: Date | string): string => {
	if (!date) return "";

	const dateObj = typeof date === "string" ? new Date(date) : date;

	try {
		return dateObj.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	} catch (error) {
		console.error("Error formatting time:", error);
		return "";
	}
};
