"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit } from "lucide-react";
import useUpdateTimeEntry from "@/app/hooks/useUpdateTimeEntry";
import { toast } from "sonner";
import { TimeEntry } from "@/types";

interface InlineDescriptionEditProps {
	entry: TimeEntry;
	onRefresh?: () => void;
}

export const InlineDescriptionEdit: React.FC<InlineDescriptionEditProps> = ({ entry, onRefresh }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState(entry.description || "");
	const [isLoading, setIsLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const { mutate: updateTimeEntry } = useUpdateTimeEntry();

	useEffect(() => {
		setValue(entry.description || "");
	}, [entry.description]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleStartEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsEditing(true);
	};

	const handleCancel = () => {
		setValue(entry.description || "");
		setIsEditing(false);
	};

	const handleSave = () => {
		if (value === entry.description) {
			setIsEditing(false);
			return;
		}

		setIsLoading(true);
		updateTimeEntry(
			{
				id: entry.id,
				data: {
					description: value,
				},
			},
			{
				onSuccess: () => {
					toast.success("Description updated");
					setIsEditing(false);
					onRefresh?.();
				},
				onError: (error) => {
					console.error("Failed to update description:", error);
					toast.error("Failed to update description");
					setValue(entry.description || "");
				},
				onSettled: () => {
					setIsLoading(false);
				},
			}
		);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleCancel();
		}
	};

	const handleInputClick = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	if (isEditing) {
		return (
			<div className="flex items-center gap-1 w-full max-w-[300px]">
				<Input
					ref={inputRef}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onClick={handleInputClick}
					className="h-8 text-sm"
					disabled={isLoading}
					placeholder="Enter description..."
				/>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
					onClick={handleSave}
					disabled={isLoading}
				>
					<Check className="h-3 w-3" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
					onClick={handleCancel}
					disabled={isLoading}
				>
					<X className="h-3 w-3" />
				</Button>
			</div>
		);
	}

	return (
		<div
			className="group flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 max-w-[300px]"
			onClick={handleStartEdit}
		>
			<span className="truncate text-sm flex-1">
				{entry.description || (
					<span className="text-muted-foreground italic">Click to add description</span>
				)}
			</span>
			<Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
		</div>
	);
};