import { Project } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchProjects = async (): Promise<Project[]> => {
	const response = await axios.get("/api/projects");
	return response.data;
};

export const useProjects = () =>
	useQuery<Project[]>({
		queryKey: ["customers"],
		queryFn: fetchProjects,
		staleTime: 60 * 1000,
		retry: 3,
	});
