// US Federal Holidays helper
export function getUSFederalHolidays(year: number): Date[] {
	const holidays: Date[] = [];

	// New Year's Day - January 1
	holidays.push(new Date(year, 0, 1));

	// Martin Luther King Jr. Day - Third Monday in January
	const mlkDay = getNthWeekday(year, 0, 1, 3);
	holidays.push(mlkDay);

	// Presidents' Day - Third Monday in February
	const presidentsDay = getNthWeekday(year, 1, 1, 3);
	holidays.push(presidentsDay);

	// Memorial Day - Last Monday in May
	const memorialDay = getLastWeekday(year, 4, 1);
	holidays.push(memorialDay);

	// Independence Day - July 4
	holidays.push(new Date(year, 6, 4));

	// Labor Day - First Monday in September
	const laborDay = getNthWeekday(year, 8, 1, 1);
	holidays.push(laborDay);

	// Columbus Day - Second Monday in October
	const columbusDay = getNthWeekday(year, 9, 1, 2);
	holidays.push(columbusDay);

	// Veterans Day - November 11
	holidays.push(new Date(year, 10, 11));

	// Thanksgiving Day - Fourth Thursday in November
	const thanksgiving = getNthWeekday(year, 10, 4, 4);
	holidays.push(thanksgiving);

	// Christmas Day - December 25
	holidays.push(new Date(year, 11, 25));

	return holidays;
}

// Helper function to get the Nth occurrence of a weekday in a month
function getNthWeekday(year: number, month: number, dayOfWeek: number, n: number): Date {
	const firstDay = new Date(year, month, 1);
	const firstDayOfWeek = firstDay.getDay();
	let offset = dayOfWeek - firstDayOfWeek;
	if (offset < 0) offset += 7;
	const nthDay = 1 + offset + (n - 1) * 7;
	return new Date(year, month, nthDay);
}

// Helper function to get the last occurrence of a weekday in a month
function getLastWeekday(year: number, month: number, dayOfWeek: number): Date {
	const lastDay = new Date(year, month + 1, 0);
	const lastDayOfWeek = lastDay.getDay();
	let offset = lastDayOfWeek - dayOfWeek;
	if (offset < 0) offset += 7;
	return new Date(year, month + 1, -offset);
}

// Check if a date is a US federal holiday
export function isUSFederalHoliday(date: Date): boolean {
	const holidays = getUSFederalHolidays(date.getFullYear());
	return holidays.some(holiday =>
		holiday.getDate() === date.getDate() &&
		holiday.getMonth() === date.getMonth() &&
		holiday.getFullYear() === date.getFullYear()
	);
}

// Check if a date is a weekend
export function isWeekend(date: Date): boolean {
	const day = date.getDay();
	return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// Get next business day (skipping weekends and holidays)
export function getNextBusinessDay(date: Date): Date {
	const nextDay = new Date(date);
	nextDay.setDate(nextDay.getDate() + 1);

	while (isWeekend(nextDay) || isUSFederalHoliday(nextDay)) {
		nextDay.setDate(nextDay.getDate() + 1);
	}

	return nextDay;
}

// Generate W-2 week entries (Monday-Friday, skipping holidays)
export function generateW2WeekEntries(startDate: Date): Date[] {
	const entries: Date[] = [];
	let currentDate = new Date(startDate);

	// If start date isn't Monday, find the Monday of that week
	const dayOfWeek = currentDate.getDay();
	if (dayOfWeek !== 1) {
		// Calculate days to subtract to get to Monday
		const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		currentDate.setDate(currentDate.getDate() + daysToMonday);
	}

	// Generate 5 weekday entries
	for (let i = 0; i < 5; i++) {
		// Skip weekends (shouldn't happen if we start on Monday, but just in case)
		while (isWeekend(currentDate)) {
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Only add if it's not a holiday
		if (!isUSFederalHoliday(currentDate)) {
			entries.push(new Date(currentDate));
		}

		currentDate.setDate(currentDate.getDate() + 1);
	}

	return entries;
}