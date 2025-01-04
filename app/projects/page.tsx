"use client";
import React, { useState } from "react";
import { Flex, Table, Button, Heading } from "@radix-ui/themes";
import { Archive } from "lucide-react";
import AddDocument from "./AddDocument";
import EditDocument from "./EditDocument";
import ProjectFilters from "./ProjectFilters";
import { useProjects } from "../hooks/useProjects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Project } from "@prisma/client";

const ProjectsPage = () => {
	const queryClient = useQueryClient();
	const { data: projects } = useProjects();
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("name-asc");
	const [showArchived, setShowArchived] = useState(false);

	const archiveMutation = useMutation({
		mutationFn: async (project: Project) => {
			const payload = {
				id: project.id,
				name: project.name,
				customerId: project.customerId,
				description: project.description || "",
				rate: project.rate,
				archived: !project.archived,
			};

			await axios.patch(`/api/projects/${project.id}`, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
		},
		onError: (error: unknown) => {
			if (error instanceof Error) {
				console.error("Mutation error:", error.message);
			}
		},
	});

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

	const handleArchiveProject = async (project: Project) => {
		await archiveMutation.mutateAsync(project);
	};

	return (
		<div className="space-y-4 p-4">
			<Flex justify="between" align="center" className="mb-4">
				<Heading className="text-2xl font-bold">Projects</Heading>
				<AddDocument />
			</Flex>

			<ProjectFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				sortBy={sortBy}
				onSortChange={setSortBy}
				showArchived={showArchived}
				onArchivedChange={setShowArchived}
			/>

			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>Project Name</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Project Description</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Project Rate</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{sortedProjects?.map((project) => (
						<Table.Row key={project.id} className={project.archived ? "opacity-60" : ""}>
							<Table.RowHeaderCell>{project.name}</Table.RowHeaderCell>
							<Table.Cell>{project.description}</Table.Cell>
							<Table.Cell>${project.rate}</Table.Cell>
							<Table.Cell>{project.archived ? "Archived" : "Active"}</Table.Cell>
							<Table.Cell>
								<Flex gap="2">
									<EditDocument project={project} />
									<Button
										variant="soft"
										color={project.archived ? "green" : "red"}
										onClick={() => handleArchiveProject({ ...project, name: project.name!, customerId: project.customerId! })}>
										<Archive className="h-4 w-4" />
										{project.archived ? "Unarchive" : "Archive"}
									</Button>
								</Flex>
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>
		</div>
	);
};

export default ProjectsPage;
