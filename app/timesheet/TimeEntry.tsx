import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Spinner, Text } from "@radix-ui/themes";
import useDeleteTimeEntry from "../hooks/useDeleteTimeEntry";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface TimeEntryProps {
	entry: {
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
	};
	startSlot: number;
	endSlot: number;
	dayIndex: number;
	onUpdate: (id: number, updatedData: Partial<TimeEntryProps["entry"]>) => void;
	onDelete: (id: number) => void;
}

const TimeEntryComponent = ({ entry, startSlot, endSlot, dayIndex, onUpdate, onDelete }: TimeEntryProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isloading, setLoading] = useState(false);
	const [formState, setFormState] = useState({
		date: entry.date.toISOString().split("T")[0],
		duration: entry.duration?.toString() || "",
		description: entry.description || "",
		userId: entry.userId,
		customerId: entry.customerId,
		projectId: entry.projectId,
		taskId: entry.taskId,
		startTime: entry.startTime,
		endTime: entry.endTime,
	});
	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();
	const queryClient = useQueryClient();

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState((prevState) => ({
			...prevState,
			[name]: name === "duration" ? parseInt(value, 10) : value,
		}));
	};

	const handleUpdate = async () => {
		setLoading(true);
		const originalStartTime = entry.startTime ? new Date(`${entry.date}T${entry.startTime}:00`) : new Date();
		const newEndTime = new Date(originalStartTime.getTime() + parseInt(formState.duration) * 60000);
		const updatedFormState = {
			...formState,
			date: new Date(formState.date).toISOString(),
			endTime: `${newEndTime.getHours().toString().padStart(2, "0")}:${newEndTime.getMinutes().toString().padStart(2, "0")}`,
		};
		try {
			await axios.patch(`/api/timelog/${entry.id}`, updatedFormState);
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
			queryClient.refetchQueries();
		} catch (error) {
			console.error("Failed to update time entry:", error);
		} finally {
			setIsOpen(false);
			setLoading(false);
		}
	};

	const handleDelete = () => {
		deleteTimeEntry(entry.id, {
			onSuccess: () => {
				setIsOpen(false);
				onDelete(entry.id);
			},
			onError: (error) => {
				console.error("Error deleting time entry:", error);
			},
		});
		queryClient.refetchQueries();
	};

	return (
		<Popover.Root open={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger asChild>
				<div
					className="absolute bg-blue-500 text-white p-1 rounded-xl cursor-pointer"
					style={{
						gridColumn: `${dayIndex + 2} / ${dayIndex + 3}`,
						top: `${(startSlot / 1440) * 100}%`,
						height: `${((endSlot - startSlot) / 1440) * 100}%`,
						width: "90%",
						left: "5%",
					}}
					aria-haspopup="dialog"
					aria-expanded={isOpen}
					aria-controls={`popover-${entry.id}`}
					data-state={isOpen ? "open" : "closed"}>
					<Text>{entry.duration && entry.duration / 60} Hours</Text>
					<br />
					<Text>{entry.name}</Text>
					<br />
					<Text>{entry.description}</Text>
					<br />
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
							className="block w-full mt-1 border border-gray-300 rounded dark:text-black"
						/>
					</label>
					<label>
						Duration:
						<input
							type="number"
							name="duration"
							value={formState.duration}
							onChange={handleFormChange}
							className="block w-full mt-1 border border-gray-300 dark:text-black"
						/>
					</label>
					<div className="flex space-x-2">
						<button type="button" onClick={handleUpdate} disabled={isloading} className="px-4 py-2 text-white bg-blue-500 rounded">
							{isloading ? <Spinner /> : "Update"}
						</button>
						<button type="button" onClick={handleDelete} disabled={isloading} className="px-4 py-2 text-white bg-red-500 rounded">
							{isloading ? <Spinner /> : "Delete"}
						</button>
					</div>
				</form>
			</Popover.Content>
		</Popover.Root>
	);
};

export default TimeEntryComponent;
