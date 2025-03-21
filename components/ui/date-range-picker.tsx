import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
	from?: Date;
	to?: Date;
	onSelect: (range: DateRange | undefined) => void;
	className?: string;
}

export function DateRangePicker({ from, to, onSelect, className }: DateRangePickerProps) {
	const [date, setDate] = React.useState<DateRange | undefined>({
		from: from,
		to: to,
	});

	// Update local state when props change
	React.useEffect(() => {
		setDate({ from, to });
	}, [from, to]);

	return (
		<div className={cn("grid gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{date?.from ? (
							date.to ? (
								<>
									{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
								</>
							) : (
								format(date.from, "LLL dd, y")
							)
						) : (
							<span>Pick a date range</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[600px] p-0" align="start">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={date?.from}
						selected={date}
						onSelect={(newDate) => {
							setDate(newDate); // Update immediately to show selection
							if (newDate?.from && newDate?.to) {
								onSelect(newDate);
							}
						}}
						numberOfMonths={2}
						classNames={{
							day_range_start: "day-range-start",
							day_range_end: "day-range-end",
							day_range_middle: "day-range-middle",
						}}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
