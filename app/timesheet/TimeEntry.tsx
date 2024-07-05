import React from "react";

type TimeEntryProps = {
	entry: {
		id: number;
		description: string | null;
		duration: number;
		date: Date;
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
};

const TimeEntryComponent: React.FC<TimeEntryProps> = ({ entry, startSlot, endSlot, dayIndex }) => {
	return (
		<div
			className="absolute bg-blue-500 text-white p-1 rounded-md"
			style={{
				gridColumnStart: dayIndex + 1,
				gridColumnEnd: dayIndex + 2,
				top: `${(startSlot / 1440) * 100}%`,
				height: `${((endSlot - startSlot) / 1440) * 100}%`,
				width: "90%", // Adjust the width to fit within the column
				left: "5%", // Center the entry within the column
			}}>
			{entry.description}
		</div>
	);
};

export default TimeEntryComponent;
