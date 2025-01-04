// hooks/useProjects.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Project {
	id: number;
	name: string | null;
	description: string | null;
	rate: number | null;
	customerId: number | null;
	dateCreated: Date;
	archived: boolean;
}

export const useProjects = () => {
	return useQuery<Project[]>({
		queryKey: ["projects"],
		queryFn: async () => {
			const { data } = await axios.get("/api/projects");
			return data;
		},
		staleTime: 1000 * 60, // Consider data stale after 1 minute
	});
};
