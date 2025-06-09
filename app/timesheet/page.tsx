"use client";
import { useState, useEffect, useRef } from "react";
import "./timeEntries.css";
import { endOfWeek, startOfWeek } from "date-fns";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import TimeToolBar from "./TimeToolBar";
import TimeGrid from "./TimeGrid";
import LogTime from "./LogTime";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock } from "lucide-react";
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
	const [isMounted, setIsMounted] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setIsMounted(true);
		return () => setIsMounted(false);
	}, []);

	// Debug effect to log dialog state changes
	useEffect(() => {
		console.log("Dialog state changed:", logTimeOpen);
	}, [logTimeOpen]);

	const { data, error, isLoading } = useGetTimeEntries({
		pageSize: 20,
		page: 1,
		startDate: filters.startDate ? new Date(filters.startDate) : undefined,
		endDate: filters.endDate ? new Date(filters.endDate) : undefined,
		customerId: filters.customerId !== null && filters.customerId !== undefined ? filters.customerId : undefined,
	});

	const handleTimeSlotSelect = (timeSlot: any) => {
		console.log("Time slot selected:", timeSlot);
		setSelectedTimeSlot(timeSlot);
		setLogTimeOpen(true);
	};

	const handleLogTimeClick = () => {
		console.log("Log Time button clicked");
		setLogTimeOpen(true);
	};

	return (
		<div className="flex flex-col h-full">
			<Dialog open={logTimeOpen} onOpenChange={setLogTimeOpen}>
				<DialogTrigger asChild>
					<Button variant="default" className="hidden" onClick={handleLogTimeClick} id="log-time-trigger">
						Open Log Time
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Log Time</DialogTitle>
					</DialogHeader>
					<div className="overflow-y-auto flex-1 -mx-6 px-6">
						<LogTime
							initialValues={{
								date: selectedTimeSlot?.date || new Date(),
								startTime: selectedTimeSlot?.startTime,
								endTime: selectedTimeSlot?.endTime,
								duration: selectedTimeSlot?.duration,
							}}
							onClose={() => setLogTimeOpen(false)}
						/>
					</div>
				</DialogContent>
			</Dialog>
			{isLoading ? (
				<Skeleton className="h-[600px] w-full" />
			) : error ? (
				<AlertDialog open={true}>
					<AlertDialogContent>
						<AlertDialogTitle>Database Error</AlertDialogTitle>
						<AlertDialogDescription>The Database connection cannot be established. Check your connection and try again.</AlertDialogDescription>
					</AlertDialogContent>
				</AlertDialog>
			) : (
				<>
					<TimeToolBar filters={filters} setFilters={setFilters}>
						<Button variant="default" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleLogTimeClick}>
							<Clock className="h-4 w-4" />
							<span className="font-medium">Log Time</span>
						</Button>
					</TimeToolBar>
					<TimeGrid filters={filters} onTimeSlotSelect={handleTimeSlotSelect} isDialogOpen={logTimeOpen} />
				</>
			)}
		</div>
	);
};

export default Page;
