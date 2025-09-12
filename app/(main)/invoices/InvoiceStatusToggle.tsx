"use client";
import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import useUpdateTimeEntry from "@/app/hooks/useUpdateTimeEntry";
import { toast } from "sonner";
import { TimeEntry } from "@/types";

interface InvoiceStatusToggleProps {
	entry: TimeEntry;
	onRefresh?: () => void;
	showBadge?: boolean;
}

export const InvoiceStatusToggle: React.FC<InvoiceStatusToggleProps> = ({ 
	entry, 
	onRefresh, 
	showBadge = false 
}) => {
	const [isLoading, setIsLoading] = useState(false);

	const { mutate: updateTimeEntry } = useUpdateTimeEntry();

	const handleToggle = (checked: boolean) => {
		setIsLoading(true);
		updateTimeEntry(
			{
				id: entry.id,
				data: {
					isClientInvoiced: checked,
				},
			},
			{
				onSuccess: () => {
					toast.success(`Entry marked as ${checked ? "invoiced" : "not invoiced"}`);
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

	if (showBadge) {
		return (
			<div className="flex items-center gap-2">
				<Badge
					variant={entry.isInvoiced ? "default" : "secondary"}
					className={`flex items-center gap-1 ${
						entry.isInvoiced 
							? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
							: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
					}`}
				>
					{entry.isInvoiced ? (
						<CheckCircle className="h-3 w-3" />
					) : (
						<XCircle className="h-3 w-3" />
					)}
					{entry.isInvoiced ? "Invoiced" : "Not Invoiced"}
				</Badge>
				
				{isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Switch
						checked={entry.isInvoiced || false}
						onCheckedChange={handleToggle}
						disabled={isLoading}
						className="scale-75"
					/>
				)}
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center">
			{isLoading ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<Switch
					checked={entry.isInvoiced || false}
					onCheckedChange={handleToggle}
					disabled={isLoading}
				/>
			)}
		</div>
	);
};