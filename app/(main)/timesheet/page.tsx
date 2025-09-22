"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, CalendarCheck2 } from "lucide-react";
import LogTime from "./LogTime";
import TimeToolBar from "./TimeToolBar";
import { EditTimeEntryModal } from "../invoices/EditTimeEntryModal";

// Dynamically import the calendar to avoid SSR issues with FullCalendar
const TimesheetCalendar = dynamic(() => import("./TimesheetCalendar"), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
			<p className="text-muted-foreground">Loading calendar...</p>
		</div>
	),
});

interface Filters {
	startDate?: Date;
	endDate?: Date;
	customerId?: number;
}

export default function TimesheetPage() {
	const [filters, setFilters] = useState<Filters>({
		startDate: startOfWeek(new Date(), { weekStartsOn: 0 }),
		endDate: endOfWeek(new Date(), { weekStartsOn: 0 }),
		customerId: undefined,
	});

	const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
		date?: Date;
		startTime?: string;
		endTime?: string;
		duration?: number;
	} | null>(null);
	const [isW2WeekEntry, setIsW2WeekEntry] = useState(false);
	const [editingEntry, setEditingEntry] = useState<any>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const handleDateRangeChange = (start: Date, end: Date) => {
		setFilters((prev) => ({
			...prev,
			startDate: start,
			endDate: end,
		}));
	};

	const handleLogTimeClick = () => {
		setIsW2WeekEntry(false);
		setEditingEntry(null);
		setSelectedTimeSlot({
			date: new Date(),
			startTime: "09:00",
			endTime: "17:00",
			duration: 480,
		});
		setIsLogTimeOpen(true);
	};

	const handleW2WeekClick = () => {
		console.log("W-2 Week button clicked");
		setIsW2WeekEntry(true);
		setEditingEntry(null);
		// Set to Monday of current week
		const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
		setSelectedTimeSlot({
			date: monday,
			startTime: "09:00",
			endTime: "17:00",
			duration: 480,
		});
		setIsLogTimeOpen(true);
	};

	const handleEventClick = (entry: any) => {
		console.log("Opening entry for edit:", entry);
		setEditingEntry(entry);
		setIsEditModalOpen(true);
	};

	return (
		<div className="flex flex-col h-screen overflow-hidden">
			<Dialog open={isLogTimeOpen} onOpenChange={setIsLogTimeOpen}>
				<DialogTrigger asChild>
					<Button variant="default" className="hidden" onClick={handleLogTimeClick} id="log-time-trigger">
						Open Log Time
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Log Time</DialogTitle>
					</DialogHeader>
					<div className="overflow-y-auto flex-1 -mx-6 px-6">
						<LogTime
							initialValues={{
								date: selectedTimeSlot?.date || new Date(),
								startTime: selectedTimeSlot?.startTime,
								endTime: selectedTimeSlot?.endTime,
								duration: selectedTimeSlot?.duration,
							}}
							onClose={() => setIsLogTimeOpen(false)}
						/>
					</div>
				</DialogContent>
			</Dialog>

			<TimeToolBar filters={filters} setFilters={setFilters}>
				<Button variant="default" className="flex items-center gap-2" onClick={handleLogTimeClick}>
					<Clock className="h-4 w-4" />
					<span className="font-medium">Log Time</span>
				</Button>
				<Button variant="outline" className="flex items-center gap-2" onClick={handleW2WeekClick}>
					<CalendarCheck2 className="h-4 w-4" />
					<span className="font-medium">W-2 Week</span>
				</Button>
			</TimeToolBar>

			{/* Main Calendar View - Takes remaining space */}
			<div className="flex-1 min-h-0 overflow-hidden">
				<TimesheetCalendar
					startDate={filters.startDate || new Date()}
					endDate={filters.endDate || new Date()}
					onDateRangeChange={handleDateRangeChange}
					onEventClick={handleEventClick}
				/>
			</div>

			{/* Edit Time Entry Modal */}
			<EditTimeEntryModal
				entry={editingEntry}
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setEditingEntry(null);
				}}
				onRefresh={() => {
					// The TimesheetCalendar will auto-refresh via react-query
				}}
			/>
		</div>
	);
}
