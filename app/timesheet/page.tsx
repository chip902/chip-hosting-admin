"use client";
import { useState } from "react";
import "./timeEntries.css";
import { endOfWeek, startOfWeek } from "date-fns";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import TimeToolBar from "./TimeToolBar";
import TimeGrid from "./TimeGrid";
import LogTime from "./LogTime";
import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Filters {
	startDate?: Date;
	endDate?: Date;
	customerId?: number;
}

const Page: React.FC = () => {
	const [filters, setFilters] = useState<Filters>({
		startDate: startOfWeek(new Date(), { weekStartsOn: 0 }),
		endDate: endOfWeek(new Date(), { weekStartsOn: 0 }),
		customerId: undefined,
	});

	const [logTimeOpen, setLogTimeOpen] = useState(false);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
		date?: Date;
		startTime?: string;
		endTime?: string;
		duration?: number;
	} | null>(null);

	const { data, error, isLoading } = useGetTimeEntries({
		pageSize: 20,
		page: 1,
		startDate: filters.startDate ? new Date(filters.startDate) : undefined,
		endDate: filters.endDate ? new Date(filters.endDate) : undefined,
		customerId: filters.customerId !== null && filters.customerId !== undefined ? filters.customerId : undefined,
	});

	const handleTimeSlotSelect = (timeSlot: any) => {
		// Only show LogTime dialog if timeSlot has actual data
		if (timeSlot && Object.keys(timeSlot).length > 0) {
			setLogTimeOpen(true);
			setSelectedTimeSlot(timeSlot);
		} else {
			setLogTimeOpen(false);
			setSelectedTimeSlot(null);
		}
	};

	return (
		<Dialog
			open={logTimeOpen}
			onOpenChange={(open) => {
				if (!open || selectedTimeSlot) {
					setLogTimeOpen(open);
				}
			}}>
			<div className="flex-col gap-4">
				{isLoading ? (
					<Skeleton>
						<div className="relative w-full h-fit" />
					</Skeleton>
				) : error ? (
					<AlertDialog defaultOpen={true}>
						<div className="w-[450px]">
							<AlertDialogContent>
								<AlertDialogTitle>Database Error</AlertDialogTitle>
								<AlertDialogDescription>
									The Database connection cannot be established. Check your connection and try again.
								</AlertDialogDescription>
							</AlertDialogContent>
						</div>
					</AlertDialog>
				) : (
					<>
						<TimeToolBar filters={filters} setFilters={setFilters}>
							<DialogTrigger asChild>
								<Button variant="default">Log Time</Button>
							</DialogTrigger>
						</TimeToolBar>
						<TimeGrid filters={filters} onTimeSlotSelect={handleTimeSlotSelect} isDialogOpen={logTimeOpen} />
						<DialogContent className="min-w-[600px]">
							<DialogTitle>Log Time</DialogTitle>
							<LogTime onClose={() => setLogTimeOpen(false)} initialValues={selectedTimeSlot || undefined} />
						</DialogContent>
					</>
				)}
			</div>
		</Dialog>
	);
};

export default Page;
