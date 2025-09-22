"use client";

import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetTimeEntries } from "@/app/hooks/useGetTimeEntries";
import useUpdateTimeEntry from "@/app/hooks/useUpdateTimeEntry";
import { format, startOfWeek, endOfWeek, parseISO, differenceInMinutes, addMinutes } from "date-fns";
import { type TimeEntry } from "@/types";

interface TimesheetCalendarProps {
	startDate: Date;
	endDate: Date;
	onDateRangeChange?: (start: Date, end: Date) => void;
	onEventClick?: (entry: TimeEntry) => void;
}

export default function TimesheetCalendar({ startDate, endDate, onDateRangeChange, onEventClick }: TimesheetCalendarProps) {
	const [currentDate, setCurrentDate] = useState(startDate);
	const calendarRef = useRef<any>(null);

	// Fetch time entries
	const { data, isLoading, error } = useGetTimeEntries({
		startDate: startOfWeek(currentDate, { weekStartsOn: 1 }),
		endDate: endOfWeek(currentDate, { weekStartsOn: 1 }),
		pageSize: 100,
		page: 1,
	});

	const { mutate: updateTimeEntry } = useUpdateTimeEntry();

	// Group entries by day to detect mixed W2/1099 work
	const entriesByDay = data?.entries?.reduce((acc: any, entry: TimeEntry) => {
		const entryDate = format(parseISO(entry.startTime), 'yyyy-MM-dd');
		if (!acc[entryDate]) {
			acc[entryDate] = [];
		}
		acc[entryDate].push(entry);
		return acc;
	}, {}) || {};

	// Debug: Log first entry to see data structure
	if (data?.entries?.length > 0) {
		console.log('[TIMESHEET] Sample entry data:', JSON.stringify(data.entries[0], null, 2));
	}

	// Convert time entries to FullCalendar events
	const events =
		data?.entries?.map((entry: TimeEntry) => {
			const startTime = parseISO(entry.startTime);
			const endTime = entry.endTime ? parseISO(entry.endTime) : addMinutes(startTime, entry.duration || 60);
			const entryDate = format(startTime, 'yyyy-MM-dd');
			const dayEntries = entriesByDay[entryDate] || [];
			
			// Check if this day has mixed W2 and 1099 work
			const w2Entries = dayEntries.filter((e: any) => e.customer?.employmentType === 'W2');
			const contractorEntries = dayEntries.filter((e: any) => e.customer?.employmentType === 'CONTRACTOR_1099');
			const hasMixedWork = w2Entries.length > 0 && contractorEntries.length > 0;
			
			// Determine if this is a W2 entry
			const isW2Entry = entry.customer?.employmentType === 'W2';
			
			// Get base color and apply W2 styling logic
			const baseColor = getColorForCustomer(entry.customer?.id || 0);
			const { backgroundColor, borderColor, opacity } = getEntryColors(baseColor, isW2Entry, hasMixedWork);

			return {
				id: entry.id.toString(),
				title: `${entry.customer?.name || "No Client"} - ${entry.project?.name || "No Project"}`,
				start: startTime,
				end: endTime,
				backgroundColor,
				borderColor,
				extendedProps: {
					entry: entry,
					customerName: entry.customer?.name,
					projectName: entry.project?.name,
					taskName: entry.task?.name,
					description: entry.description,
					isW2Entry,
					hasMixedWork,
					opacity,
				},
			};
		}) || [];

	// Simple color assignment based on customer ID
	function getColorForCustomer(customerId: number): string {
		const colors = [
			"#3B82F6", // blue
			"#10B981", // emerald
			"#F59E0B", // amber
			"#8B5CF6", // violet
			"#EF4444", // red
			"#06B6D4", // cyan
			"#84CC16", // lime
			"#F97316", // orange
		];
		return colors[customerId % colors.length];
	}

	// Apply W2-specific styling logic
	function getEntryColors(baseColor: string, isW2Entry: boolean, hasMixedWork: boolean) {
		if (!isW2Entry) {
			// 1099 entries always use full color
			return {
				backgroundColor: baseColor,
				borderColor: baseColor,
				opacity: 1,
			};
		}

		// W2 entries
		if (hasMixedWork) {
			// W2 entry on a day with mixed work -> much more muted/subdued
			return {
				backgroundColor: baseColor + "40", // 25% opacity - much more muted
				borderColor: baseColor + "80", // 50% opacity border  
				opacity: 0.5,
			};
		} else {
			// W2 entry alone for the day -> full color
			return {
				backgroundColor: baseColor,
				borderColor: baseColor,
				opacity: 1,
			};
		}
	}

	const handleEventDrop = async (dropInfo: any) => {
		const { event } = dropInfo;
		const entry = event.extendedProps.entry;
		const newStartTime = event.start;
		const newEndTime = event.end;

		// Calculate new duration
		const duration = differenceInMinutes(newEndTime, newStartTime);

		// Update the entry with timezone information
		await updateTimeEntry({
			id: entry.id,
			data: {
				date: newStartTime,
				endDate: newEndTime,
				duration: duration,
			},
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		});
	};

	const handleEventResize = async (resizeInfo: any) => {
		const { event } = resizeInfo;
		const entry = event.extendedProps.entry;
		const newStartTime = event.start;
		const newEndTime = event.end;

		// Calculate new duration
		const duration = differenceInMinutes(newEndTime, newStartTime);

		// Update the entry with timezone information
		await updateTimeEntry({
			id: entry.id,
			data: {
				date: newStartTime,
				endDate: newEndTime,
				duration: duration,
			},
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		});
	};

	const handleEventClick = (clickInfo: any) => {
		const entry = clickInfo.event.extendedProps.entry;
		console.log("Clicked entry for edit:", entry);
		if (onEventClick) {
			onEventClick(entry);
		}
	};

	const handleNavigate = (action: "prev" | "next" | "today") => {
		if (calendarRef.current) {
			const calendarApi = calendarRef.current.getApi();

			if (action === "prev") {
				calendarApi.prev();
			} else if (action === "next") {
				calendarApi.next();
			} else {
				calendarApi.today();
			}

			// Update current date and notify parent
			const newDate = calendarApi.getDate();
			setCurrentDate(newDate);

			if (onDateRangeChange) {
				const start = startOfWeek(newDate, { weekStartsOn: 1 });
				const end = endOfWeek(newDate, { weekStartsOn: 1 });
				onDateRangeChange(start, end);
			}
		}
	};

	return (
		<div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
				<div className="flex items-center gap-2">
					<Button variant="outline" size="icon" onClick={() => handleNavigate("prev")} className="h-8 w-8">
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleNavigate("today")} className="h-8">
						Today
					</Button>
					<Button variant="outline" size="icon" onClick={() => handleNavigate("next")} className="h-8 w-8">
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				<h2 className="text-xl font-semibold">Week of {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}</h2>
			</div>

			{/* Calendar - Takes remaining space */}
			<div className="flex-1 p-2 overflow-hidden">
				<FullCalendar
					ref={calendarRef}
					plugins={[timeGridPlugin, interactionPlugin]}
					initialView="timeGridWeek"
					headerToolbar={false}
					height="100%"
					events={events}
					eventClick={handleEventClick}
					eventDrop={handleEventDrop}
					eventResize={handleEventResize}
					editable={true}
					selectable={true}
					selectMirror={true}
					nowIndicator={true}
					timeZone="local"
					slotMinTime="00:00:00"
					slotMaxTime="24:00:00"
					allDaySlot={false}
					weekends={true}
					firstDay={1} // Monday
					slotDuration="00:15:00" // 15-minute slots
					slotLabelInterval="01:00:00" // Show hour labels
					slotLabelFormat={{
						hour: "2-digit",
						minute: "2-digit",
						hour12: true,
					}}
					dayHeaderFormat={{ weekday: "short", month: "numeric", day: "numeric" }}
					eventTimeFormat={{
						hour: "2-digit",
						minute: "2-digit",
						hour12: true,
					}}
					// Custom event rendering
					eventContent={(eventInfo) => {
						const entry = eventInfo.event.extendedProps;
						return (
							<div className="p-1 text-xs overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
								<div className="font-semibold truncate">{eventInfo.timeText}</div>
								<div className="truncate">{entry.customerName}</div>
								{entry.projectName && <div className="truncate text-[10px] opacity-75">{entry.projectName}</div>}
							</div>
						);
					}}
					eventClassNames="cursor-pointer"
				/>
			</div>
		</div>
	);
}
