"use client";
import { subWeeks, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import React, { useState, useCallback } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import LogTime from "./LogTime";

interface ITimeToolBar {
	filters: {
		startDate?: Date;
		endDate?: Date;
		customerId?: number;
	};
	setFilters: React.Dispatch<
		React.SetStateAction<{
			startDate?: Date;
			endDate?: Date;
			customerId?: number;
		}>
	>;
}

const TimeToolBar = ({ filters, setFilters }: ITimeToolBar) => {
	const [currentWeek, setCurrentWeek] = useState(new Date());

	// Directly update the filters and current week inside the handler
	const handlePreviousWeek = useCallback(() => {
		const newWeek = subWeeks(currentWeek, 1);
		const start = startOfWeek(newWeek, { weekStartsOn: 0 });
		const end = endOfWeek(newWeek, { weekStartsOn: 0 });

		setCurrentWeek(newWeek);
		setFilters({
			startDate: start,
			endDate: end,
			customerId: filters.customerId,
		});
	}, [currentWeek, filters.customerId, setFilters]);

	const handleNextWeek = useCallback(() => {
		const newWeek = addWeeks(currentWeek, 1);
		const start = startOfWeek(newWeek, { weekStartsOn: 0 });
		const end = endOfWeek(newWeek, { weekStartsOn: 0 });

		setCurrentWeek(newWeek);
		setFilters({
			startDate: start,
			endDate: end,
			customerId: filters.customerId,
		});
	}, [currentWeek, filters.customerId, setFilters]);

	const handleToday = useCallback(() => {
		const today = new Date();
		const start = startOfWeek(today, { weekStartsOn: 0 });
		const end = endOfWeek(today, { weekStartsOn: 0 });

		setCurrentWeek(today);
		setFilters({
			startDate: start,
			endDate: end,
			customerId: filters.customerId,
		});
	}, [filters.customerId, setFilters]);

	return (
		<header className="flex flex-col items-center border-b border-gray-200 px-6 py-4 z-20 dark:border-gray-700">
			<div className="flex w-full items-center justify-end">
				<div className="ml-6 h-6 w-px bg-gray-300 dark:bg-gray-700" />
				<LogTime />

				<div className="flex items-center ml-5">
					<div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch dark:bg-gray-800">
						<button
							type="button"
							onClick={handlePreviousWeek}
							className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-400">
							<span className="sr-only">Previous week</span>
							<ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
						</button>
						<button
							type="button"
							onClick={handleToday}
							className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
							Today
						</button>
						<span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden dark:bg-gray-700" />
						<button
							type="button"
							onClick={handleNextWeek}
							className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-400">
							<span className="sr-only">Next week</span>
							<ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
						</button>
					</div>
				</div>
			</div>
		</header>
	);
};

export default TimeToolBar;
