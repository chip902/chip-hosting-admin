"use client";
import { subWeeks, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import React, { ReactNode, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
	children?: ReactNode;
}

const TimeToolBar = ({ filters, setFilters, children }: ITimeToolBar) => {
	const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);

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
		<header className="sticky top-0 bg-slate-50/80 backdrop-blur-sm dark:bg-gray-900/80 border-b border-slate-200 dark:border-gray-700 px-6 py-4 z-20">
			<div className="flex w-full items-center justify-between">
				{/* Left side - Log Time Button */}
				<div className="flex items-center">
					<Button onClick={() => setIsLogTimeOpen(true)} className={cn("flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white")}>
						<Clock className="h-4 w-4" />
						<span className="font-medium">Log Time</span>
					</Button>

					{/* Add the LogTime component */}
					{isLogTimeOpen && (
						<LogTime
							onClose={() => setIsLogTimeOpen(false)}
							initialValues={{
								date: new Date(),
								startTime: "09:00",
								endTime: "17:00",
							}}
						/>
					)}
				</div>

				{/* Right side - Date Navigation */}
				<div className="flex items-center space-x-4">
					{/* Date display */}
					<div className="hidden md:flex items-center space-x-3 mr-4">
						<Calendar className="h-4 w-4 text-slate-600 dark:text-gray-400" />
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300">
							{filters.startDate?.toLocaleDateString("en-US", {
								month: "long",
								day: "numeric",
							})}{" "}
							-{" "}
							{filters.endDate?.toLocaleDateString("en-US", {
								month: "long",
								day: "numeric",
								year: "numeric",
							})}
						</span>
					</div>

					{/* Navigation Controls */}
					<div className="flex rounded-lg overflow-hidden shadow-sm">
						<Button
							onClick={handlePreviousWeek}
							className={cn(
								"relative px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700",
								"hover:bg-slate-100 dark:hover:bg-gray-700",
								"text-slate-700 dark:text-gray-300",
								"transition-colors duration-200",
								"flex items-center justify-center",
								"first:rounded-l-lg last:rounded-r-lg",
								"focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
							)}>
							<ChevronLeft className="h-4 w-4" />
						</Button>

						<Button
							onClick={handleToday}
							className={cn(
								"relative px-4 py-2 bg-white dark:bg-gray-800 border-y border-x border-slate-200 dark:border-gray-700",
								"hover:bg-slate-100 dark:hover:bg-gray-700",
								"text-sm font-medium",
								"text-slate-700 dark:!text-gray-300",
								"hover:text-slate-900 dark:hover:!text-white",
								"transition-colors duration-200",
								"min-w-[80px]",
								"focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
							)}>
							Today
						</Button>

						<Button
							onClick={handleNextWeek}
							className={cn(
								"relative px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700",
								"hover:bg-slate-100 dark:hover:bg-gray-700",
								"text-slate-700 dark:text-gray-300",
								"transition-colors duration-200",
								"flex items-center justify-center",
								"first:rounded-l-lg last:rounded-r-lg",
								"focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
							)}>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
};

export default TimeToolBar;
