// app/timesheet/TimeGridHeader.tsx
import React from "react";
import { format, isToday } from "date-fns";
import classNames from "classnames";

interface TimeGridHeaderProps {
	days: Date[];
}

const TimeGridHeader = ({ days }: TimeGridHeaderProps) => {
	// Get unique months in the current week view
	const months = Array.from(new Set(days.map((day) => format(day, "MMMM yyyy"))));

	return (
		<div className="relative">
			<div className="sticky top-0 z-30 bg-white shadow ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
				{/* Month row */}
				<div className="grid grid-cols-8 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 dark:divide-gray-700 dark:border-gray-700">
					<div className="col-start-1 col-end-2 w-14"></div>
					<div className="col-start-2 col-end-9 grid grid-cols-7">
						{months.map((month, index) => {
							// Count how many days belong to this month
							const daysInMonth = days.filter((day) => format(day, "MMMM yyyy") === month).length;

							return (
								<div
									key={month}
									className="text-center py-2 font-semibold text-gray-900 dark:text-gray-300"
									style={{
										gridColumn: `span ${daysInMonth}`,
									}}>
									{month}
								</div>
							);
						})}
					</div>
				</div>

				{/* Days row */}
				<div className="grid grid-cols-8 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 dark:divide-gray-700 dark:border-gray-700">
					<div className="col-start-1 col-end-2 w-14"></div>
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
		</div>
	);
};

export default TimeGridHeader;
