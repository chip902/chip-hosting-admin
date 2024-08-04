"use client";
import React, { useEffect, useRef } from "react";
import TimeEntryComponent from "./TimeEntry";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { TimeEntryData, useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { toZonedTime } from "date-fns-tz";
import { format, isToday } from "date-fns";
import classNames from "classnames";

interface TimeGridProps {
	filters: {
		startDate?: Date;
		endDate?: Date;
		customerId?: number;
	};
}

const TimeGrid = ({ filters }: TimeGridProps) => {
	const container = useRef<HTMLDivElement>(null);
	const { startDate, endDate, customerId } = filters;
	const { data, error, isLoading } = useGetTimeEntries(startDate, endDate, customerId);

	useEffect(() => {
		// Scroll to current hour on load
		const currentMinute = new Date().getHours() * 60;
		if (container.current) {
			container.current.scrollTop = (container.current.scrollHeight * currentMinute) / 1440;
		}
	}, [container]);

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

	if (isLoading) {
		return <div>Loading...</div>;
	}

	const start = startDate ? new Date(startDate) : new Date();
	const days = Array.from({ length: 7 }, (_, i) => {
		const date = new Date(start);
		date.setDate(date.getDate() + i);
		return date;
	});

	const timeZone = "America/New_York";

	return (
		<div className="relative flex flex-col bg-white dark:bg-gray-900">
			<div className="sticky top-0 z-10 bg-white shadow ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
				<div className="grid grid-cols-8 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 dark:divide-gray-700 dark:border-gray-700">
					<div className="col-start-1 col-end-2 w-14 hourColumn"></div> {/* Empty space for the time column */}
					{days.map((day, index) => (
						<div key={index} className="flex items-center justify-center py-3 col-span-1">
							<span
								className={classNames(
									isToday(day) ? "bg-indigo-600 text-white p-3 rounded-xl" : "text-gray-900 dark:text-gray-300",
									"flex items-baseline"
								)}>
								{format(day, "EEE")}{" "}
								<span
									className={classNames(
										isToday(day) ? "rounded-xl bg-indigo-600 text-white" : "text-gray-900 dark:text-gray-300",
										"ml-1.5 flex h-8 w-8 items-center justify-center font-semibold"
									)}>
									{format(day, "d")}
								</span>
							</span>
						</div>
					))}
				</div>
			</div>
			<div ref={container} className="flex-auto overflow-y-auto">
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
							{data?.entries
								?.filter((entry: TimeEntryData) => {
									const entryDate = toZonedTime(new Date(entry.date), timeZone);
									const dayDate = new Date(day);
									return entryDate.toDateString() === dayDate.toDateString();
								})
								.map((entry: TimeEntryData) => {
									const startDateTime = toZonedTime(new Date(entry.date), timeZone);
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
			</div>
		</div>
	);
};

export default TimeGrid;
