import React from "react";
import { Flex, Select, Switch, TextField } from "@radix-ui/themes";
import { SearchIcon } from "lucide-react";

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
		<Flex gap="4" align="center" className="p-4 rounded-lg">
			<Flex gap="2" align="center" className="flex-1">
				<SearchIcon className="text-gray-400" size={20} />
				<TextField.Root className="flex-1">
					<TextField.Root placeholder="Search projects..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
				</TextField.Root>
			</Flex>

			<Select.Root value={sortBy} onValueChange={onSortChange}>
				<Select.Trigger className="w-[200px]" />
				<Select.Content>
					<Select.Item value="name-asc">Name (A-Z)</Select.Item>
					<Select.Item value="name-desc">Name (Z-A)</Select.Item>
					<Select.Item value="rate-asc">Rate (Low to High)</Select.Item>
					<Select.Item value="rate-desc">Rate (High to Low)</Select.Item>
					<Select.Item value="date-asc">Date (Oldest first)</Select.Item>
					<Select.Item value="date-desc">Date (Newest first)</Select.Item>
				</Select.Content>
			</Select.Root>

			<Flex gap="2" align="center">
				<Switch checked={showArchived} onCheckedChange={onArchivedChange} />
				<span>Show Archived</span>
			</Flex>
		</Flex>
	);
};

export default ProjectFilters;
