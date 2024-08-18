// app/timesheet/TimeGridHeader.tsx
import React from "react";
import { format, isToday } from "date-fns";
import classNames from "classnames";

interface TimeGridHeaderProps {
	days: Date[];
}

const TimeGridHeader = ({ days }: TimeGridHeaderProps) => {
	return (
		<div className="relative">
			{/* This wrapper helps ensure no conflicting styles */}
			<div className="sticky top-0 z-30 bg-white shadow ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
				<div className="grid grid-cols-8 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 dark:divide-gray-700 dark:border-gray-700">
					<div className="col-start-1 col-end-2 w-14 hourColumn"></div>
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
