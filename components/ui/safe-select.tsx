import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Control, FieldPath, FieldValues } from "react-hook-form";

// Props for the SafeSelect component
interface SafeSelectProps {
	value: string | undefined;
	onValueChange: (value: string) => void;
	placeholder?: string;
	children?: React.ReactNode;
	className?: string;
	disabled?: boolean;
}

// This wrapper component handles the conversion between empty strings and undefined
// while maintaining your original data model
export const SafeSelect = ({ value, onValueChange, placeholder, children, ...props }: SafeSelectProps) => {
	// Convert empty string to undefined for the Select component
	const selectValue = value === "" ? undefined : value;

	// Keep the original value (including empty strings) in the parent component
	const handleValueChange = (newValue: string) => {
		onValueChange(newValue);
	};

	return (
		<Select value={selectValue} onValueChange={handleValueChange} {...props}>
			<SelectTrigger>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			{children}
		</Select>
	);
};

// Props for the SafeSelectField component
interface SafeSelectFieldProps<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> {
	control: Control<TFieldValues>;
	name: TName;
	label: string;
	placeholder?: string;
	children: React.ReactNode;
	className?: string;
	disabled?: boolean;
}

// Typed version of SafeSelectField for use with react-hook-form
export function SafeSelectField<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({
	control,
	name,
	label,
	placeholder,
	children,
	className,
	disabled,
}: SafeSelectFieldProps<TFieldValues, TName>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<SafeSelect value={field.value} onValueChange={field.onChange} placeholder={placeholder} disabled={disabled}>
							{children}
						</SafeSelect>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
