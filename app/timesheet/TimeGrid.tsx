import React from "react";
import TimeEntryComponent from "./TimeEntry";
import { timeLogSchema } from "../validationSchemas";
import { z } from "zod";

type TimeLogSchema = z.infer<typeof timeLogSchema> & { id: number; invoiceItemId: number | null };

type TimeGridProps = {
	days: Date[];
	timeEntries: TimeLogSchema[];
};

const TimeGrid: React.FC<TimeGridProps> = ({ days, timeEntries }: TimeGridProps) => {
	const handleUpdate = async (id: number, updatedData: Partial<TimeLogSchema>) => {
		try {
			if (updatedData.date && typeof updatedData.date !== "string") {
				updatedData.date = updatedData.date[0];
			}
			const response = await fetch(`/api/timelog/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedData),
			});
			if (!response.ok) {
				throw new Error("Failed to update the time entry");
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			const response = await fetch(`/api/timelog/${id}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error("Failed to delete the time entry");
			}
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="grid grid-cols-8 divide-y divide-gray-100 dark:divide-gray-700">
			<div className="col-start-1 col-end-2 grid grid-rows-24 divide-y divide-gray-100 dark:divide-gray-700">
				{[...Array(24)].map((_, hour) => (
					<div key={hour} className="relative h-16">
						<div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-gray-500">
							{hour % 12 === 0 ? 12 : hour % 12}
							{hour < 12 ? "AM" : "PM"}
						</div>
					</div>
				))}
			</div>

			{days.map((day, dayIndex) => (
				<div key={dayIndex} className="relative col-span-1 border-l border-gray-100 dark:border-gray-700">
					{[...Array(24)].map((_, hour) => (
						<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700"></div>
					))}
					{timeEntries
						.filter((entry) => new Date(entry.date).toDateString() === day.toDateString())
						.map((entry) => {
							const startDateTime = new Date(entry.date);
							const startHour = startDateTime.getHours();
							const startMinute = startDateTime.getMinutes();
							const endDateTime = new Date(startDateTime.getTime() + entry.duration * 60000);
							const endHour = endDateTime.getHours();
							const endMinute = endDateTime.getMinutes();
							const startSlot = startHour * 60 + startMinute;
							const endSlot = endHour * 60 + endMinute;

							return (
								<TimeEntryComponent
									key={entry.id}
									entry={{ ...entry, date: startDateTime.toISOString().split("T")[0], description: entry.description ?? "" }}
									startSlot={startHour * 60 + startMinute}
									endSlot={endHour * 60 + endMinute}
									dayIndex={days.findIndex((day) => day.toDateString() === startDateTime.toDateString())}
									onUpdate={handleUpdate}
									onDelete={handleDelete}
								/>
							);
						})}
				</div>
			))}
		</div>
	);
};

export default TimeGrid;
