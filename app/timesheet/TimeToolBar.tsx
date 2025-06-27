"use client";
import { subWeeks, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import React, { ReactNode, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CopyPreviousWeekButton from "./CopyPreviousWeekButton";

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
		<header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 z-10">
			<div className="flex w-full items-center justify-between">
				{/* Left side - Log Time Button */}
				<div className="flex items-center gap-2">
					{filters.startDate && (
						<CopyPreviousWeekButton 
							currentStartDate={filters.startDate} 
							onSuccess={() => window.location.reload()}
						/>
					)}
					{children}
				</div>

				{/* Right side - Date Navigation */}
				<div className="flex items-center space-x-4">
					{/* Date display */}
					<div className="hidden md:flex items-center space-x-3 mr-4">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						<span className="text-14 font-medium">
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
								"relative px-3 py-2 bg-background border border-border",
								"hover:bg-accent hover:text-accent-foreground",
								"transition-colors duration-200",
								"flex items-center justify-center",
								"first:rounded-l-lg last:rounded-r-lg",
								"focus:z-10 focus:outline-none focus:ring-2 focus:ring-ring"
							)}>
							<ChevronLeft className="h-4 w-4" />
						</Button>

						<Button
							onClick={handleToday}
							className={cn(
								"relative px-4 py-2 bg-background border-y border-x border-border",
								"hover:bg-accent hover:text-accent-foreground",
								"text-14 font-medium",
								"transition-colors duration-200",
								"min-w-[80px]",
								"focus:z-10 focus:outline-none focus:ring-2 focus:ring-ring"
							)}>
							Today
						</Button>

						<Button
							onClick={handleNextWeek}
							className={cn(
								"relative px-3 py-2 bg-background border border-border",
								"hover:bg-accent hover:text-accent-foreground",
								"transition-colors duration-200",
								"flex items-center justify-center",
								"first:rounded-l-lg last:rounded-r-lg",
								"focus:z-10 focus:outline-none focus:ring-2 focus:ring-ring"
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
