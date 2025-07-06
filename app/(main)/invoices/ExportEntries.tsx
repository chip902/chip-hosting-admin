"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { addDays, format, subMonths } from "date-fns";
import { Download, ChevronDown, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import Papa from "papaparse";

interface TimeEntryExporterProps {
	customerId?: number;
}

const TimeEntryExporter: React.FC<TimeEntryExporterProps> = ({ customerId }) => {
	// Default date range (last 30 days)
	const defaultDateRange: DateRange = {
		from: subMonths(new Date(), 1),
		to: new Date(),
	};

	const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
	const [exportFormat, setExportFormat] = useState<string>("csv");
	const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(customerId ? String(customerId) : undefined);
	const [isExporting, setIsExporting] = useState(false);

	// Fetch customer data for the dropdown
	const { data: customerData } = useQuery({
		queryKey: ["customers"],
		queryFn: async () => {
			const response = await axios.get("/api/customers");
			return response.data;
		},
	});

	const handleExport = async () => {
		if (!dateRange.from || !dateRange.to) {
			toast.error("Please select a date range");
			return;
		}

		setIsExporting(true);

		try {
			// Fetch time entries based on filters
			const response = await axios.get("/api/timelog", {
				params: {
					startDate: format(dateRange.from, "yyyy-MM-dd"),
					endDate: format(dateRange.to, "yyyy-MM-dd"),
					customerId: selectedCustomerId,
					pageSize: 1000, // Get a large number of entries
					page: 1,
				},
			});

			const { entries } = response.data;

			if (!entries || entries.length === 0) {
				toast.warning("No time entries found for the selected filters");
				setIsExporting(false);
				return;
			}

			// Format entries for export
			const formattedEntries = entries.map((entry: any) => ({
				date: format(new Date(entry.date), "yyyy-MM-dd"),
				startTime: format(new Date(entry.startTime), "HH:mm"),
				endTime: format(new Date(entry.endTime), "HH:mm"),
				description: entry.description || "",
				duration: entry.duration || 0,
				customerName: entry.customerName || entry.customer?.name || "",
				projectName: entry.projectName || entry.project?.name || "",
				taskName: entry.taskName || entry.task?.name || "",
				customerId: entry.customerId,
				projectId: entry.projectId,
				taskId: entry.taskId,
				userId: entry.userId,
				isInvoiced: entry.isInvoiced ? "Yes" : "No",
			}));

			// Generate file based on selected format
			if (exportFormat === "csv") {
				const csv = Papa.unparse(formattedEntries);
				downloadFile(csv, "time-entries.csv", "text/csv");
			} else if (exportFormat === "json") {
				const json = JSON.stringify(formattedEntries, null, 2);
				downloadFile(json, "time-entries.json", "application/json");
			} else if (exportFormat === "xlsx") {
				// For XLSX, we'll use the browser to download through an API endpoint
				const response = await axios.post(
					"/api/timelog/export",
					{
						entries: formattedEntries,
						format: "xlsx",
					},
					{
						responseType: "blob",
					}
				);

				const url = window.URL.createObjectURL(new Blob([response.data]));
				const link = document.createElement("a");
				link.href = url;
				link.setAttribute("download", "time-entries.xlsx");
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}

			toast.success(`${formattedEntries.length} time entries exported successfully`);
		} catch (error) {
			console.error("Export error:", error);
			toast.error("Failed to export time entries", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsExporting(false);
		}
	};

	const downloadFile = (content: string, filename: string, contentType: string) => {
		const blob = new Blob([content], { type: contentType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<Card className="mb-6">
			<CardHeader className="pb-3">
				<CardTitle className="text-xl font-semibold flex items-center">
					<Download className="mr-2 h-5 w-5" />
					Export Time Entries
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{/* Date Range Picker */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Date Range</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dateRange?.from ? (
										dateRange.to ? (
											<>
												{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
											</>
										) : (
											format(dateRange.from, "LLL dd, y")
										)
									) : (
										<span>Pick a date range</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									required={false}
									mode="range"
									defaultMonth={dateRange?.from}
									selected={dateRange}
									onSelect={() => setDateRange}
									numberOfMonths={2}
								/>
								<div className="p-3 border-t border-border flex justify-between">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const today = new Date();
											setDateRange({
												from: subMonths(today, 1),
												to: today,
											});
										}}>
										Last 30 Days
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const today = new Date();
											setDateRange({
												from: new Date(today.getFullYear(), today.getMonth(), 1),
												to: today,
											});
										}}>
										This Month
									</Button>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					{/* Customer Selection */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Customer</label>
						<Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
							<SelectTrigger>
								<SelectValue placeholder="All Customers" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">All Customers</SelectItem>
								{customerData?.map((customer: any) => (
									<SelectItem key={customer.id} value={customer.id.toString()}>
										{customer.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Export Format */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Export Format</label>
						<Select value={exportFormat} onValueChange={setExportFormat}>
							<SelectTrigger>
								<SelectValue placeholder="Select format" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="csv">CSV</SelectItem>
								<SelectItem value="json">JSON</SelectItem>
								<SelectItem value="xlsx">Excel (XLSX)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Export Button */}
					<div className="flex items-end">
						<Button onClick={handleExport} disabled={isExporting || !dateRange.from || !dateRange.to} className="w-full plaidlink-primary">
							{isExporting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Exporting...
								</>
							) : (
								<>
									<Download className="mr-2 h-4 w-4" />
									Export Entries
								</>
							)}
						</Button>
					</div>
				</div>

				<div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
					Export time entries for your records or to import into another system. Select a date range and optionally filter by customer.
				</div>
			</CardContent>
		</Card>
	);
};

export default TimeEntryExporter;
