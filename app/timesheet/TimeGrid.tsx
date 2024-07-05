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
		<div className="relative grid w-full flex-auto grid-cols-8 grid-rows-24">
			{/* Time slots */}
			{[...Array(24)].map((_, hour) => (
				<div key={hour} className="relative h-full border-t border-gray-100 dark:border-gray-700">
					<div className=" left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-gray-500">
						{hour % 12 === 0 ? 12 : hour % 12}
						{hour < 12 ? "AM" : "PM"}
					</div>
				</div>
			))}
			{/* Vertical grid lines */}
			{days.map((_, index) => (
				<div key={index} className={`col-start-${index + 2} col-end-${index + 3} row-span-full border-l border-gray-100 dark:border-gray-700`} />
			))}

			{/* Time Entries */}
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
