import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";

type TimeEntryProps = {
	entry: {
		id: number;
		description: string | null;
		duration: number;
		date: string;
		userId: number;
		taskId: number;
		customerId: number;
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
};

const TimeEntryComponent: React.FC<TimeEntryProps> = ({ entry, startSlot, endSlot, dayIndex, onUpdate, onDelete }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, isLoading] = useState(false);
	const [formState, setFormState] = useState({
		date: entry.date,
		duration: entry.duration,
		description: entry.description || "",
	});

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleUpdate = () => {
		isLoading(true);
		onUpdate(entry.id, formState);
		setIsOpen(false);
	};

	const handleDelete = () => {
		isLoading(true);
		onDelete(entry.id);
		setIsOpen(false);
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
					<h4>{entry.duration / 60} Hours</h4>
					{entry.description}
				</div>
			</Popover.Trigger>
			<Popover.Content className="p-4 bg-gray-500 rounded shadow-lg">
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
						<button type="button" onClick={handleUpdate} className="px-4 py-2 text-white bg-blue-500 rounded">
							Update
						</button>
						<button type="button" onClick={handleDelete} className="px-4 py-2 text-white bg-red-500 rounded">
							Delete
						</button>
					</div>
				</form>
			</Popover.Content>
		</Popover.Root>
	);
};

export default TimeEntryComponent;
