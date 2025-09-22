"use client";
import React, { useState, useEffect } from "react";
import AddDocument from "./AddDocument";
import ProjectFilters from "./ProjectFilters";
import { useProjects } from "@/app/hooks/useProjects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Project } from "@/prisma/app/generated/prisma/client";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import ProjectActions from "./ProjectActions";
import { toast } from "sonner";
import { Customer } from "@/types";

const ProjectsPage = () => {
	const queryClient = useQueryClient();
	const { data: projects } = useProjects();
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("name-asc");
	const [showArchived, setShowArchived] = useState(false);

	useEffect(() => {
		const fetchCustomers = async () => {
			try {
				const response = await axios.get("/api/data");
				setCustomers(response.data.customers);
			} catch (error) {
				console.error("Error fetching customers:", error);
			}
		};
		fetchCustomers();
	}, []);

	const archiveMutation = useMutation({
		mutationFn: async (project: Project) => {
			const payload = {
				id: project.id,
				name: project.name,
				customerId: project.customerId,
				description: project.description || "",
				rate: project.rate || 0,
				archived: !project.archived,
			};
			await axios.patch(`/api/projects/${project.id}`, payload);
		},
		onSuccess: (_, project) => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			toast.success(project.archived ? `Project "${project.name}" has been unarchived` : `Project "${project.name}" has been archived`);
		},
		onError: (error: unknown) => {
			if (error instanceof Error) {
				console.error("Mutation error:", error.message);
				toast.error("Failed to archive project", {
					description: error.message,
				});
			}
		},
	});

	const handleArchiveProject = async (project: Project) => {
		toast.promise(archiveMutation.mutateAsync(project), {
			loading: "Updating project...",
			success: () => {
				return `Project ${project.archived ? "unarchived" : "archived"} successfully`;
			},
			error: "Failed to update project",
		});
	};

	// Filter projects
	const filteredProjects = projects?.filter((project) => {
		const matchesSearch =
			(project.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
			(project.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
		const matchesArchived = showArchived || !project.archived;
		return matchesSearch && matchesArchived;
	});

	// Sort projects
	const sortedProjects = [...(filteredProjects || [])].sort((a, b) => {
		switch (sortBy) {
			case "name-asc":
				return (a.name || "").localeCompare(b.name || "");
			case "name-desc":
				return (b.name || "").localeCompare(a.name || "");
			case "rate-asc":
				return (a.rate || 0) - (b.rate || 0);
			case "rate-desc":
				return (b.rate || 0) - (a.rate || 0);
			case "date-asc":
				return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
			case "date-desc":
				return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
			default:
				return 0;
		}
	});

	return (
		<div className="space-y-4 p-4">
			<div className="flex-col justify-between align-middle mb-4">
				<h2 className="mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0">Projects</h2>
				<AddDocument />
			</div>

			<ProjectFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				sortBy={sortBy}
				onSortChange={setSortBy}
				showArchived={showArchived}
				onArchivedChange={setShowArchived}
			/>

			<Table>
				<TableHeader>
					<TableRow>
						<TableCell>Project Name</TableCell>
						<TableCell>Customer</TableCell>
						<TableCell>Description</TableCell>
						<TableCell>Rate</TableCell>
						<TableCell>Tasks</TableCell>
						<TableCell>Status</TableCell>
						<TableCell>Actions</TableCell>
					</TableRow>
				</TableHeader>

				<TableBody>
					{sortedProjects?.map((project) => {
						const customer = customers?.find(c => c.id === project.customerId);
						return (
							<TableRow key={project.id} className={project.archived ? "opacity-60" : ""}>
								<TableCell className="font-medium">{project.name}</TableCell>
								<TableCell>{customer?.name || "Unknown Customer"}</TableCell>
								<TableCell>{project.description || "No description"}</TableCell>
								<TableCell>${project.rate || 0}</TableCell>
								<TableCell>
									{(project as any).tasks?.length > 0 ? (
										<div className="flex flex-wrap gap-1">
											{(project as any).tasks.slice(0, 2).map((task: any) => (
												<span key={task.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
													{task.name}
												</span>
											))}
											{(project as any).tasks.length > 2 && (
												<span className="text-xs text-muted-foreground">+{(project as any).tasks.length - 2} more</span>
											)}
										</div>
									) : (
										<span className="text-muted-foreground text-sm">No tasks</span>
									)}
								</TableCell>
								<TableCell>{project.archived ? "Archived" : "Active"}</TableCell>
								<TableCell>
									<ProjectActions
										project={{
											...project,
											name: project.name || "",
											description: project.description || "",
											customerId: project.customerId || 0,
											rate: project.rate || 0,
										}}
										onArchive={handleArchiveProject}
									/>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};

export default ProjectsPage;
