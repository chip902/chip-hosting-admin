"use client";
import React, { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Copy, Trash2, CheckCircle, XCircle, FileText } from "lucide-react";
import useDeleteTimeEntry from "@/app/hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "@/app/hooks/useUpdateTimeEntry";
import useDuplicateTimeEntry from "@/app/hooks/useDuplicateTimeEntry";
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

interface TimeEntryActionsProps {
	entry: TimeEntry;
	onEdit: () => void;
	onRefresh?: () => void;
}

export const TimeEntryActions: React.FC<TimeEntryActionsProps> = ({ entry, onEdit, onRefresh }) => {
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();
	const { mutate: updateTimeEntry } = useUpdateTimeEntry();
	const { mutate: duplicateTimeEntry } = useDuplicateTimeEntry();

	const handleDelete = () => {
		setIsLoading(true);
		deleteTimeEntry(
			{ id: entry.id },
			{
				onSuccess: () => {
					toast.success("Time entry deleted successfully");
					setShowDeleteAlert(false);
					onRefresh?.();
				},
				onError: (error) => {
					console.error("Failed to delete entry:", error);
					toast.error("Failed to delete time entry");
				},
				onSettled: () => {
					setIsLoading(false);
				},
			}
		);
	};

	const handleDuplicate = () => {
		setIsLoading(true);
		duplicateTimeEntry(entry.id, {
			onSuccess: () => {
				toast.success("Time entry duplicated successfully");
				onRefresh?.();
			},
			onError: (error) => {
				console.error("Failed to duplicate entry:", error);
				toast.error("Failed to duplicate time entry");
			},
			onSettled: () => {
				setIsLoading(false);
			},
		});
	};

	const handleToggleInvoiced = () => {
		setIsLoading(true);
		updateTimeEntry(
			{
				id: entry.id,
				data: {
					isClientInvoiced: !entry.isInvoiced,
				},
			},
			{
				onSuccess: () => {
					toast.success(`Entry marked as ${!entry.isInvoiced ? "invoiced" : "not invoiced"}`);
					onRefresh?.();
				},
				onError: (error) => {
					console.error("Failed to update invoice status:", error);
					toast.error("Failed to update invoice status");
				},
				onSettled: () => {
					setIsLoading(false);
				},
			}
		);
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
						<span className="sr-only">Open menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[200px]">
					<DropdownMenuItem onClick={onEdit} className="cursor-pointer">
						<Edit className="mr-2 h-4 w-4" />
						Edit Entry
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
						<Copy className="mr-2 h-4 w-4" />
						Duplicate
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleToggleInvoiced} className="cursor-pointer">
						{entry.isInvoiced ? (
							<>
								<XCircle className="mr-2 h-4 w-4" />
								Mark as Not Invoiced
							</>
						) : (
							<>
								<CheckCircle className="mr-2 h-4 w-4" />
								Mark as Invoiced
							</>
						)}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => setShowDeleteAlert(true)} className="cursor-pointer text-destructive focus:text-destructive">
						<Trash2 className="mr-2 h-4 w-4" />
						Delete Entry
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete this time entry. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};