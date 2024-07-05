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
		<div className="relative grid flex-auto grid-cols-7">
			{/* Time Slots */}
			<div
				className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100 dark:divide-gray-700"
				style={{ gridTemplateRows: "repeat(24, minmax(4rem, 1fr))" }}>
				{[...Array(24)].map((_, hour) => (
					<div key={hour} className="relative h-full">
						<div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-gray-500">
							{hour % 12 === 0 ? 12 : hour % 12}
							{hour < 12 ? "AM" : "PM"}
						</div>
					</div>
				))}
			</div>

			{/* Vertical lines and Time Entries */}
			{days.map((_, dayIndex) => (
				<div key={dayIndex} className={`col-start-${dayIndex + 2} col-end-${dayIndex + 3} border-l border-gray-100 dark:border-gray-700`}>
					{[...Array(24)].map((_, hour) => (
						<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700" />
					))}
				</div>
			))}

			{timeEntries.flatMap((entry) => {
				const startDateTime = new Date(entry.date);
				const startHour = startDateTime.getHours();
				const startMinute = startDateTime.getMinutes();
				const endDateTime = new Date(startDateTime.getTime() + entry.duration * 60000);
				const endHour = endDateTime.getHours();
				const endMinute = endDateTime.getMinutes();
				return Array.from({ length: entry.repeatInterval ?? 1 }).map((_, i) => {
					const currentStart = new Date(startDateTime.getTime());
					currentStart.setDate(currentStart.getDate() + i);
					const dayIndex = days.findIndex((day) => day.getFullYear() === currentStart.getFullYear() && day.getDate() === currentStart.getDate());
					if (dayIndex === -1) return null;
					const startSlot = startHour * 60 + startMinute;
					const endSlot = endHour * 60 + endMinute;

					return (
						<TimeEntryComponent
							key={`${entry.id}-${i}`}
							entry={{ ...entry, date: startDateTime, description: entry.description ?? "" }}
							startSlot={startSlot}
							endSlot={endSlot}
							dayIndex={dayIndex}
						/>
					);
				});
			})}
		</div>
	);
};

export default TimeGrid;
