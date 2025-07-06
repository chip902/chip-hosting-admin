import React from "react";
import { SearchIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface ProjectFiltersProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	sortBy: string;
	onSortChange: (value: string) => void;
	showArchived: boolean;
	onArchivedChange: (show: boolean) => void;
}

const ProjectFilters = ({ searchQuery, onSearchChange, sortBy, onSortChange, showArchived, onArchivedChange }: ProjectFiltersProps) => {
	return (
		<div className="flex items-center gap-4 p-4 rounded-lg bg-white">
			<div className="flex-1 flex items-center relative">
				<SearchIcon className="absolute left-3 text-gray-400" size={20} />
				<Input className="pl-10" placeholder="Search projects..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
			</div>

			<Select value={sortBy} onValueChange={onSortChange}>
				<SelectTrigger className="w-[200px]" />
				<SelectContent>
					<SelectItem value="name-asc">Name (A-Z)</SelectItem>
					<SelectItem value="name-desc">Name (Z-A)</SelectItem>
					<SelectItem value="rate-asc">Rate (Low to High)</SelectItem>
					<SelectItem value="rate-desc">Rate (High to Low)</SelectItem>
					<SelectItem value="date-asc">Date (Oldest first)</SelectItem>
					<SelectItem value="date-desc">Date (Newest first)</SelectItem>
				</SelectContent>
			</Select>

			<div className="flex items-center gap-2">
				<Switch checked={showArchived} onCheckedChange={onArchivedChange} />
				<span className="text-sm text-gray-700">Show Archived</span>
			</div>
		</div>
	);
};

export default ProjectFilters;
