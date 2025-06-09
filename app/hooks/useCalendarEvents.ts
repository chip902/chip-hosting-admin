// app/hooks/useCalendarEvents.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useCalendarEvents(credentials: any, calendars: any, dateRange: any) {
	return useQuery({
		queryKey: ["calendarEvents", credentials, calendars, dateRange],
		queryFn: async () => {
			const { data } = await axios.get("/events", {
				params: { credentials, calendars, dateRange },
			});
			return data;
		},
	});
}
