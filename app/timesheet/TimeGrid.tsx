"use client";
import React, { useEffect, useState } from "react";
import TimeEntryComponent from "./TimeEntry";
import { useGetTimeEntry, TimeEntryData } from "../hooks/useGetTimeEntry";
import { AlertDialog, Button, Flex, Skeleton } from "@radix-ui/themes";

interface TimeGridProps {
	startDate: string;
	endDate: string;
}

const TimeGrid: React.FC<TimeGridProps> = ({ startDate, endDate }) => {
	const [localLoading, setLocalLoading] = useState(true);
	const { data: timeEntries, error, isLoading } = useGetTimeEntry(startDate, endDate);

	useEffect(() => {
		setLocalLoading(true);
	}, [startDate, endDate]);
	useEffect(() => {
		if (!isLoading) {
			setLocalLoading(false);
		}
	}, [isLoading]);

	if (localLoading || isLoading) {
		return (
			<div className="time-grid grid-skeleton">
				{[...Array(168)].map((_, hour) => (
					<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700">
						<Skeleton className="grid-skeleton-item">
							<div className="w-full h-full" />
						</Skeleton>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<AlertDialog.Root defaultOpen={true}>
				<AlertDialog.Content maxWidth="450px">
					<AlertDialog.Title>Database Error</AlertDialog.Title>
					<AlertDialog.Description size="2">
						The Database connection cannot be established. Check your connection and try again.
					</AlertDialog.Description>
					<Flex gap="3" mt="4" justify="end">
						<AlertDialog.Cancel>
							<Button color="red">Dismiss</Button>
						</AlertDialog.Cancel>
					</Flex>
				</AlertDialog.Content>
			</AlertDialog.Root>
		);
	}

	const days = Array.from({ length: 7 }, (_, i) => {
		const date = new Date(startDate);
		date.setDate(date.getDate() + i);
		return date;
	});

	return (
		<div className="grid grid-cols-8">
			<div className="col-start-1 col-end-2">
				<div className="grid grid-rows-24">
					{[...Array(24)].map((_, hour) => (
						<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700">
							<div className="sticky left-0 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-gray-500">
								{hour % 12 === 0 ? 12 : hour % 12}
								{hour < 12 ? "AM" : "PM"}
							</div>
						</div>
					))}
				</div>
			</div>

			{days.map((day, dayIndex) => (
				<div key={dayIndex} className="relative col-span-1 border-l border-gray-100 dark:border-gray-700 grid grid-rows-24">
					{[...Array(24)].map((_, hour) => (
						<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700"></div>
					))}
					{timeEntries
						?.filter((entry: TimeEntryData) => {
							const entryDate = new Date(entry.date).toDateString();
							const dayDate = day.toDateString();
							const isSameDay = entryDate === dayDate;
							return isSameDay;
						})
						.map((entry: TimeEntryData) => {
							const startDateTime = new Date(entry.date);
							const startHour = startDateTime.getHours();
							const startMinute = startDateTime.getMinutes();
							const endDateTime = new Date(startDateTime.getTime() + (entry.duration ?? 0) * 60000);
							const endHour = endDateTime.getHours();
							const endMinute = endDateTime.getMinutes();
							const color = entry.Customer.color || "#000000";
							return (
								<TimeEntryComponent
									key={entry.id}
									entry={{
										...entry,
										name: entry.Customer.name,
										date: new Date(entry.date),
										description: entry.description ?? "",
									}}
									startSlot={startHour * 60 + startMinute}
									endSlot={endHour * 60 + endMinute}
									dayIndex={days.findIndex((d) => d.toDateString() === startDateTime.toDateString())}
									color={color}
								/>
							);
						})}
				</div>
			))}
		</div>
	);
};
export default TimeGrid;
