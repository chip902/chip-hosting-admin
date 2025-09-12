"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import useDeleteTimeEntry from "@/app/hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "@/app/hooks/useUpdateTimeEntry";
import { toast } from "sonner";
import { TimeEntry } from "@/types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BulkActionsBarProps {
	selectedEntries: number[];
	timeEntries: TimeEntry[];
	isSelectAllPages: boolean;
	totalEntries: number;
	onRefresh?: () => void;
	onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
	selectedEntries,
	timeEntries,
	isSelectAllPages,
	totalEntries,
	onRefresh,
	onClearSelection,
}) => {
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();
	const { mutate: updateTimeEntry } = useUpdateTimeEntry();

	// Get selected entries data
	const selectedEntriesData = isSelectAllPages
		? timeEntries // In real implementation, this should get all entries based on filters
		: timeEntries.filter((entry) => selectedEntries.includes(entry.id));

	const selectedCount = isSelectAllPages ? totalEntries : selectedEntries.length;

	// Check if all selected entries are invoiced
	const allInvoiced = selectedEntriesData.every((entry) => entry.isInvoiced);
	const someInvoiced = selectedEntriesData.some((entry) => entry.isInvoiced);

	const handleBulkDelete = async () => {
		setIsLoading(true);
		try {
			// Delete entries one by one (in real implementation, consider batch API)
			const entriesToDelete = isSelectAllPages ? timeEntries : selectedEntriesData;
			
			for (const entry of entriesToDelete) {
				await new Promise<void>((resolve, reject) => {
					deleteTimeEntry(
						{ id: entry.id },
						{
							onSuccess: () => resolve(),
							onError: (error) => reject(error),
						}
					);
				});
			}

			toast.success(`${entriesToDelete.length} time entries deleted successfully`);
			onClearSelection();
			onRefresh?.();
		} catch (error) {
			console.error("Failed to delete entries:", error);
			toast.error("Failed to delete some entries");
		} finally {
			setIsLoading(false);
			setShowDeleteAlert(false);
		}
	};

	const handleBulkUpdateInvoiceStatus = async (invoiced: boolean) => {
		setIsLoading(true);
		try {
			// Update entries one by one (in real implementation, consider batch API)
			const entriesToUpdate = isSelectAllPages ? timeEntries : selectedEntriesData;
			
			for (const entry of entriesToUpdate) {
				if (entry.isInvoiced !== invoiced) {
					await new Promise<void>((resolve, reject) => {
						updateTimeEntry(
							{
								id: entry.id,
								data: {
									isClientInvoiced: invoiced,
								},
							},
							{
								onSuccess: () => resolve(),
								onError: (error) => reject(error),
							}
						);
					});
				}
			}

			toast.success(`${entriesToUpdate.length} entries marked as ${invoiced ? "invoiced" : "not invoiced"}`);
			onRefresh?.();
		} catch (error) {
			console.error("Failed to update entries:", error);
			toast.error("Failed to update some entries");
		} finally {
			setIsLoading(false);
		}
	};

	const handleExportCSV = () => {
		try {
			const entriesToExport = isSelectAllPages ? timeEntries : selectedEntriesData;
			
			// Create CSV content
			const headers = ["Date", "Customer", "Project", "Task", "Description", "Duration (minutes)", "Invoiced"];
			const rows = entriesToExport.map((entry) => [
				new Date(entry.date).toLocaleDateString(),
				entry.customer?.name || "",
				entry.project?.name || "",
				entry.task?.name || "",
				`"${(entry.description || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
				entry.duration.toString(),
				entry.isInvoiced ? "Yes" : "No",
			]);

			const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

			// Download CSV
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", `time-entries-${new Date().toISOString().split("T")[0]}.csv`);
			link.style.visibility = "hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toast.success("CSV exported successfully");
		} catch (error) {
			console.error("Failed to export CSV:", error);
			toast.error("Failed to export CSV");
		}
	};

	if (selectedCount === 0) return null;

	return (
		<>
			<div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
				<span className="text-sm text-muted-foreground">
					{selectedCount} {selectedCount === 1 ? "entry" : "entries"} selected
				</span>
				<Separator orientation="vertical" className="h-4" />
				
				<Button
					variant="outline"
					size="sm"
					onClick={() => handleBulkUpdateInvoiceStatus(!allInvoiced)}
					disabled={isLoading}
					className="h-8"
				>
					{isLoading ? (
						<Loader2 className="mr-2 h-3 w-3 animate-spin" />
					) : allInvoiced ? (
						<XCircle className="mr-2 h-3 w-3" />
					) : (
						<CheckCircle className="mr-2 h-3 w-3" />
					)}
					{allInvoiced ? "Mark as Not Invoiced" : "Mark as Invoiced"}
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={handleExportCSV}
					disabled={isLoading}
					className="h-8"
				>
					<Download className="mr-2 h-3 w-3" />
					Export CSV
				</Button>

				<Separator orientation="vertical" className="h-4" />

				<Button
					variant="destructive"
					size="sm"
					onClick={() => setShowDeleteAlert(true)}
					disabled={isLoading}
					className="h-8"
				>
					<Trash2 className="mr-2 h-3 w-3" />
					Delete
				</Button>

				<Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8 text-xs">
					Clear Selection
				</Button>
			</div>

			<AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {selectedCount} entries?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete {selectedCount} time {selectedCount === 1 ? "entry" : "entries"}. 
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction 
							onClick={handleBulkDelete} 
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};