"use client";
import { subWeeks, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import React, { ReactNode, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
	children?: ReactNode;
}

const TimeToolBar = ({ filters, setFilters, children }: ITimeToolBar) => {
	const handlePreviousWeek = useCallback(() => {
		if (!filters.startDate) return;

		const newWeek = subWeeks(filters.startDate, 1);
		const start = startOfWeek(newWeek, { weekStartsOn: 0 });
		const end = endOfWeek(newWeek, { weekStartsOn: 0 });

		setFilters({
			startDate: start,
			endDate: end,
			customerId: filters.customerId,
		});
	}, [filters.startDate, filters.customerId, setFilters]);

	const handleNextWeek = useCallback(() => {
		if (!filters.startDate) return;

		const newWeek = addWeeks(filters.startDate, 1);
		const start = startOfWeek(newWeek, { weekStartsOn: 0 });
		const end = endOfWeek(newWeek, { weekStartsOn: 0 });

		setFilters({
			startDate: start,
			endDate: end,
			customerId: filters.customerId,
		});
	}, [filters.startDate, filters.customerId, setFilters]);

	const handleToday = useCallback(() => {
		const today = new Date();
		const start = startOfWeek(today, { weekStartsOn: 0 });
		const end = endOfWeek(today, { weekStartsOn: 0 });

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

				{children}

				<div className="flex items-center ml-5">
					<div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch dark:bg-gray-800">
						<Button
							type="button"
							onClick={handlePreviousWeek}
							variant="outline"
							size="icon"
							className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-400">
							<span className="sr-only">Previous week</span>
							<ChevronLeft className="h-5 w-5" aria-hidden="true" />
						</Button>
						<Button
							type="button"
							onClick={handleToday}
							variant="outline"
							className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-800">
							Today
						</Button>
						<span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden dark:bg-gray-700" />
						<Button
							type="button"
							onClick={handleNextWeek}
							variant="outline"
							size="icon"
							className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-400">
							<span className="sr-only">Next week</span>
							<ChevronRight className="h-5 w-5" aria-hidden="true" />
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
};

export default TimeToolBar;
