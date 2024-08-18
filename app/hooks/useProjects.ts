// app/hooks/useProjects.ts
import { Project } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchProjects = async (): Promise<Project[]> => {
	const response = await axios.get("/api/projects");
	return response.data;
};

export const useProjects = () =>
	useQuery<Project[]>({
		queryKey: ["projects"],
		queryFn: fetchProjects,
		staleTime: 60 * 1000,
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		retry: 3,
	});
