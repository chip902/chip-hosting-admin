import React from "react";
import TimeEntryComponent from "./TimeEntry";
import { timeLogSchema } from "../validationSchemas";
import { z } from "zod";

type TimeLogSchema = z.infer<typeof timeLogSchema> & { id: number; invoiceItemId: number | null };

type TimeGridProps = {
	days: Date[];
	timeEntries: TimeLogSchema[];
};

const TimeGrid: React.FC<TimeGridProps> = ({ days, timeEntries }) => {
	return (
		<div className="time-grid">
			{/* Time Column */}
			<div className="time-column">
				{[...Array(24)].map((_, hour) => (
					<div key={hour} className="relative h-16">
						<div className="absolute left-0 top-1/2 transform -translate-y-1/2 text-right text-xs leading-5 text-gray-400 dark:text-gray-500">
							{hour % 12 === 0 ? 12 : hour % 12}
							{hour < 12 ? "AM" : "PM"}
						</div>
					</div>
				))}
			</div>

			{/* Days and Time Entries */}
			{days.map((day, dayIndex) => (
				<div key={dayIndex} className="relative flex flex-col border-l border-gray-100 dark:border-gray-700">
					{[...Array(24)].map((_, hour) => (
						<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700" />
					))}
					{timeEntries.map((entry) => {
						const startDateTime = new Date(entry.date);
						const startHour = startDateTime.getHours();
						const startMinute = startDateTime.getMinutes();
						const endDateTime = new Date(startDateTime.getTime() + entry.duration * 60000);
						const endHour = endDateTime.getHours();
						const endMinute = endDateTime.getMinutes();

						// Check if the entry belongs to the current day
						const isSameDay =
							day.getFullYear() === startDateTime.getFullYear() &&
							day.getMonth() === startDateTime.getMonth() &&
							day.getDate() === startDateTime.getDate();

						if (!isSameDay) return null;

						const startSlot = startHour * 60 + startMinute;
						const endSlot = endHour * 60 + endMinute;

						return (
							<TimeEntryComponent
								key={`${entry.id}-${dayIndex}`}
								entry={{ ...entry, date: startDateTime, description: entry.description ?? "" }}
								startSlot={startSlot}
								endSlot={endSlot}
								dayIndex={dayIndex}
							/>
						);
					})}
				</div>
			))}
		</div>
	);
};

export default TimeGrid;
