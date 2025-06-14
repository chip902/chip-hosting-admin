"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClient } from "@/lib/CalendarClient";
import { RemoteAgentOnlyMode } from "./components/RemoteAgentOnlyMode";
import { RemoteAgentStatusComponent } from "./components/RemoteAgentStatus";

// Dynamically import the CalendarComponent with no SSR
const CalendarComponent = dynamic(() => import("./CalendarComponent"), { ssr: false });

// Dynamically import the CalendarSyncIntegration with no SSR
const CalendarSyncIntegration = dynamic(() => import("./CalendarSyncIntegration"), { ssr: false });

// Dynamically import the RemoteAgentStatusComponent with no SSR
const RemoteAgentStatus = dynamic(() => import("./components/RemoteAgentStatus").then(mod => ({ default: mod.RemoteAgentStatusComponent })), { ssr: false });

// Dynamically import the new CalendarManagement component with no SSR
const CalendarManagement = dynamic(() => import("./components/CalendarManagement"), { 
	ssr: false,
	loading: () => <div className="flex items-center justify-center p-8">Loading calendar management...</div>
});

export default function CalendarPage() {
	// Initial empty events state
	const [events, setEvents] = useState<any[]>([]);
	const [mode, setMode] = useState<"full" | "agents-only">("full");

	// Memoize CalendarClient to prevent recreation on every render
	const calendarClient = useMemo(() => {
		// Only create the client on the client side to avoid SSR issues
		if (typeof window === 'undefined') {
			return null;
		}
		return new CalendarClient();
	}, []);

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
		<div className="container mx-auto p-4 md:p-6 max-w-7xl calendar-wrapper">
			<Tabs defaultValue="calendar" className="space-y-6">
				{/* Header with Tabs */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Calendar</h1>
						<p className="text-gray-600 dark:text-gray-400">View and manage your schedule across all your calendars</p>
					</div>

					<TabsList className="grid w-fit grid-cols-2">
						<TabsTrigger value="calendar">Calendar View</TabsTrigger>
						<TabsTrigger value="management">
							<Settings className="w-4 h-4 mr-2" />
							Management
						</TabsTrigger>
					</TabsList>
				</div>

				{/* Calendar View Tab */}
				<TabsContent value="calendar" className="space-y-6">
					{/* Mode Toggle and Actions */}
					<div className="flex items-center justify-between">
						<div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
							<button
								onClick={() => setMode("full")}
								className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
									mode === "full"
										? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
										: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
								}`}
							>
								Full Sync
							</button>
							<button
								onClick={() => setMode("agents-only")}
								className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
									mode === "agents-only"
										? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
										: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
								}`}
							>
								Agents Only
							</button>
						</div>

						<div className="flex items-center gap-2">
							{mode === "full" ? (
								<CalendarSyncIntegration onEventsLoaded={handleEventsLoaded} />
							) : (
								calendarClient && (
									<RemoteAgentOnlyMode 
										calendarClient={calendarClient}
										onEventsLoaded={handleEventsLoaded}
									/>
								)
							)}
							
							<Button className="gap-2">
								<Plus className="h-4 w-4" />
								New Event
							</Button>
						</div>
					</div>

					{/* Main Calendar Layout */}
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						{/* Main Calendar */}
						<div className="lg:col-span-3">
							<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
								<CalendarComponent
									events={events}
									onEventClick={handleEventClick}
									onDateClick={handleDateClick}
									onEventDrop={handleEventDrop}
									onEventResize={handleEventResize}
								/>
							</div>
						</div>

						{/* Remote Agent Status Sidebar */}
						<div className="lg:col-span-1">
							{calendarClient && <RemoteAgentStatusComponent calendarClient={calendarClient} />}
						</div>
					</div>

					{events.length === 0 && (
						<div className="mt-8 text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events to display</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">Connect your calendars using the Management tab to see your events here.</p>
						</div>
					)}
				</TabsContent>

				{/* Calendar Management Tab */}
				<TabsContent value="management">
					<CalendarManagement />
				</TabsContent>
			</Tabs>
		</div>
	);
}
