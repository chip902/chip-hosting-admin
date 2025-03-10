"use client";
import React, { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Spinner, Text } from "@radix-ui/themes";
import useDeleteTimeEntry from "../hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "../hooks/useUpdateTimeEntry";
import { TimeEntryProps } from "@/types";

const TimeEntryComponent: React.FC<TimeEntryProps> = ({ entry, startSlot, endSlot, color, left, width }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setLoading] = useState(false);
	const [formState, setFormState] = useState({
		duration: entry.duration?.toString() || "",
		description: entry.description || "",
		entryDate: new Date(entry.date).toISOString().split("T")[0],
		startTime: entry.startTime.split("T")[1].replace("Z", "") || "",
	});

	const { mutate: updateTimeEntry } = useUpdateTimeEntry();
	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();

	useEffect(() => {
		setFormState({
			duration: entry.duration?.toString() || "",
			description: entry.description || "",
			entryDate: new Date(entry.date).toISOString().split("T")[0],
			startTime: entry.startTime.split("T")[1].replace("Z", "") || "",
		});
	}, [entry]);

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleUpdate = () => {
		setLoading(true);
		const isoDateStr = `${formState.entryDate}T${formState.startTime}`;
		const isoDate = new Date(isoDateStr);

		if (isNaN(isoDate.getTime())) {
			console.error("Invalid date or time format: ", isoDateStr);
			setLoading(false);
			return;
		}

		const localISOString = isoDate.toISOString();
		const localISOStringWithoutZ = localISOString.replace("Z", "");

		updateTimeEntry(
			{
				id: entry.id,
				data: {
					duration: Number(formState.duration),
					description: formState.description,
					date: localISOString,
				},
			},
			{
				onSuccess: () => {
					setIsOpen(false);
					setLoading(false);
				},
				onError: (error) => {
					console.error("Failed to update time entry:", error);
					setLoading(false);
				},
			}
		);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault(); // Prevent event bubbling
		e.stopPropagation(); // Prevent event bubbling

		setLoading(true);
		deleteTimeEntry(
			{ id: entry.id },
			{
				onSuccess: () => {
					setIsOpen(false);
					setLoading(false);
				},
				onError: (error) => {
					console.error("Error deleting time entry:", error);
					setLoading(false);
				},
			}
		);
	};

	const calculatePosition = (start: number, end: number) => {
		const offsetMinutes = 300;
		const adjustedStart = start + offsetMinutes;
		const adjustedEnd = end + offsetMinutes;

		const top = (adjustedStart / 1440) * 100;
		let height = ((adjustedEnd - adjustedStart) / 1440) * 100;
		if (height < 0) {
			height += 100;
		}
		return { top, height: Math.max(height, 1) };
	};

	const { top, height } = calculatePosition(startSlot, endSlot);

	return (
		<Popover.Root open={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger asChild>
				<div
					className="absolute time-entry bg-opacity-80 text-black-1 p-1 rounded-lg cursor-pointer overflow-hidden"
					style={{
						top: `${top}%`,
						height: `${height}%`,
						left: `${left * 100}%`,
						width: `${width * 100}%`,
						backgroundColor: color,
						zIndex: 10,
					}}>
					<Text className="text-sm">{(entry.duration / 60).toFixed(1)} Hours</Text>
					<br />
					<Text className="text-sm">{entry.name}</Text>
				</div>
			</Popover.Trigger>
			<Popover.Content className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 w-80">
				<form className="flex flex-col space-y-4" onSubmit={(e) => e.preventDefault()}>
					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description:</span>
						<textarea
							name="description"
							value={formState.description}
							onChange={handleFormChange}
							className="w-full h-24 px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
					</label>
					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date:</span>
						<input
							type="date"
							name="entryDate"
							value={formState.entryDate}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
					</label>
					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time:</span>
						<input
							type="time"
							name="startTime"
							value={formState.startTime}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
					</label>
					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes):</span>
						<input
							type="number"
							name="duration"
							value={formState.duration}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
					</label>
					<div className="flex space-x-2">
						<button
							type="button"
							onClick={handleUpdate}
							disabled={isLoading}
							className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
							{isLoading ? <Spinner /> : "Update"}
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={isLoading}
							className="flex-1 px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
							{isLoading ? <Spinner /> : "Delete"}
						</button>
					</div>
				</form>
			</Popover.Content>
		</Popover.Root>
	);
};

export default TimeEntryComponent;
