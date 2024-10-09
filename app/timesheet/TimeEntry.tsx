import React, { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Spinner, Text } from "@radix-ui/themes";
import useDeleteTimeEntry from "../hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "../hooks/useUpdateTimeEntry";

export interface TimeEntry {
	id: number;
	description: string | null;
	duration: number | undefined;
	date: Date;
	userId: number;
	taskId: number;
	customerId: number;
	name: string;
	projectId: number;
	invoiceItemId: number | null;
	startTime?: string;
	endTime?: string;
	repeatInterval?: number;
}

export interface TimeEntryProps {
	entry: TimeEntry;
	startSlot: number;
	endSlot: number;
	dayIndex: number;
	color: string;
}

const TimeEntryComponent: React.FC<TimeEntryProps> = ({ entry, startSlot, endSlot, dayIndex, color }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setLoading] = useState(false);
	const [formState, setFormState] = useState({
		duration: entry.duration?.toString() || "",
		description: entry.description || "",
	});

	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();
	const { mutate: updateTimeEntry } = useUpdateTimeEntry();

	useEffect(() => {
		setFormState({
			duration: entry.duration?.toString() || "",
			description: entry.description || "",
		});
	}, [entry]);

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleUpdate = () => {
		setLoading(true);
		updateTimeEntry(
			{ id: entry.id, data: { duration: parseInt(formState.duration), description: formState.description } },
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

	const handleDelete = () => {
		deleteTimeEntry(entry.id, {
			onSuccess: () => {
				setIsOpen(false);
			},
			onError: (error) => {
				console.error("Error deleting time entry:", error);
			},
		});
	};

	return (
		<Popover.Root open={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger asChild>
				<div
					className="time-entry absolute bg-blue-500 text-white p-1 rounded-xl cursor-pointer"
					style={{
						gridColumn: `${dayIndex + 1} / ${dayIndex - 1}`,
						top: `${(startSlot / 1440) * 100}%`,
						height: `${((endSlot - startSlot) / 1440) * 100}%`,
						width: "90%",
						left: "5%",
						backgroundColor: color,
					}}>
					<Text>{entry.duration && entry.duration / 60} Hours</Text>
					<br />
					<Text>{entry.name}</Text>
				</div>
			</Popover.Trigger>
			<Popover.Content className="p-4 bg-gray-500 rounded shadow-lg z-20">
				<form className="flex flex-col space-y-2">
					<label>
						Description:
						<input
							type="text"
							name="description"
							value={formState.description}
							onChange={handleFormChange}
							className="block w-full mt-1 border border-gray-300 rounded text-black-1"
						/>
					</label>
					<label>
						Duration:
						<input
							type="number"
							name="duration"
							value={formState.duration}
							onChange={handleFormChange}
							className="block w-full mt-1 border border-gray-300 text-black-1"
						/>
					</label>
					<div className="flex space-x-2">
						<button type="button" onClick={handleUpdate} disabled={isLoading} className="px-4 py-2 text-white bg-blue-500 rounded">
							{isLoading ? <Spinner /> : "Update"}
						</button>
						<button type="button" onClick={handleDelete} disabled={isLoading} className="px-4 py-2 text-white bg-red-500 rounded">
							{isLoading ? <Spinner /> : "Delete"}
						</button>
					</div>
				</form>
			</Popover.Content>
		</Popover.Root>
	);
};

export default TimeEntryComponent;
