"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import the CalendarComponent with no SSR
const CalendarComponent = dynamic(() => import("./CalendarComponent"), { ssr: false });

// Dynamically import the CalendarSyncIntegration with no SSR
const CalendarSyncIntegration = dynamic(() => import("./CalendarSyncIntegration"), { ssr: false });

const CalendarPage = () => {
	// Initial empty events state
	const [events, setEvents] = useState<any[]>([]);

	// This is called by CalendarSyncIntegration when events are loaded
	const handleEventsLoaded = (loadedEvents: any[]) => {
		console.log("Events loaded from calendar service:", loadedEvents.length);
		setEvents(loadedEvents);
	};

	const handleEventClick = (event: any) => {
		console.log("Event clicked:", event);
		// Handle event click (e.g., open event details modal)
	};

	const handleDateClick = (date: Date) => {
		console.log("Date clicked:", date);
		// Handle date click (e.g., open new event form with pre-filled date)
	};

	const handleEventDrop = (dropInfo: any) => {
		const { event } = dropInfo;
		console.log("Event dropped:", event);
		// Update event in your state/API
	};

	const handleEventResize = (resizeInfo: any) => {
		const { event } = resizeInfo;
		console.log("Event resized:", event);
		// Update event in your state/API
	};

	return (
		<div className="container mx-auto p-4 md:p-6 max-w-7xl">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
					<p className="text-gray-600 dark:text-gray-400">View and manage your schedule across all your calendars</p>
				</div>
				<div className="flex items-center gap-2">
					{/* Calendar Sync Integration */}
					<CalendarSyncIntegration onEventsLoaded={handleEventsLoaded} />

					<Button className="gap-2">
						<Plus className="h-4 w-4" />
						New Event
					</Button>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
				<CalendarComponent
					events={events}
					onEventClick={handleEventClick}
					onDateClick={handleDateClick}
					onEventDrop={handleEventDrop}
					onEventResize={handleEventResize}
				/>
			</div>

			{events.length === 0 && (
				<div className="mt-8 text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events to display</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-4">Connect your calendars using the Settings button above to see your events here.</p>
				</div>
			)}
		</div>
	);
};

export default CalendarPage;
