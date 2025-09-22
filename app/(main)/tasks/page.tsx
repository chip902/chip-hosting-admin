"use client";

import React, { useState, useEffect } from "react";
import AddTask from "./AddTask";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { Trash2, Edit } from "lucide-react";

interface Task {
	id: number;
	name: string;
	description: string | null;
	rate: number | null;
	projects: Array<{
		id: number;
		name: string;
		customer: {
			name: string;
		};
	}>;
}

const TasksPage = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);

	const fetchTasks = async () => {
		try {
			setLoading(true);
			const response = await axios.get("/api/tasks");
			setTasks(response.data);
		} catch (error) {
			console.error("Error fetching tasks:", error);
			toast.error("Failed to fetch tasks");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTasks();
	}, []);

	const handleDeleteTask = async (taskId: number, taskName: string) => {
		if (!confirm(`Are you sure you want to delete the task "${taskName}"?`)) {
			return;
		}

		try {
			await toast.promise(axios.delete(`/api/tasks/${taskId}`), {
				loading: "Deleting task...",
				success: "Task deleted successfully",
				error: "Failed to delete task",
			});
			
			fetchTasks(); // Refresh the list
		} catch (error) {
			console.error("Error deleting task:", error);
		}
	};

	// Filter tasks based on search query
	const filteredTasks = tasks.filter((task) =>
		task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		(task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	if (loading) {
		return (
			<div className="space-y-4 p-4">
				<div className="flex justify-center items-center h-32">
					<div className="text-muted-foreground">Loading tasks...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 p-4">
			<div className="flex justify-between items-center mb-4">
				<div>
					<h2 className="mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0">
						Task Management
					</h2>
					<p className="text-muted-foreground">Manage tasks that can be assigned to projects</p>
				</div>
				<AddTask onTaskCreated={fetchTasks} />
			</div>

			{/* Search Filter */}
			<div className="flex gap-4 mb-4">
				<Input
					placeholder="Search tasks..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="max-w-sm"
				/>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableCell>Task Name</TableCell>
						<TableCell>Description</TableCell>
						<TableCell>Rate</TableCell>
						<TableCell>Assigned Projects</TableCell>
						<TableCell>Actions</TableCell>
					</TableRow>
				</TableHeader>

				<TableBody>
					{filteredTasks.length === 0 ? (
						<TableRow>
							<TableCell colSpan={5} className="text-center text-muted-foreground">
								{searchQuery ? "No tasks found matching your search." : "No tasks created yet."}
							</TableCell>
						</TableRow>
					) : (
						filteredTasks.map((task) => (
							<TableRow key={task.id}>
								<TableCell className="font-medium">{task.name}</TableCell>
								<TableCell>{task.description || "No description"}</TableCell>
								<TableCell>{task.rate ? `$${task.rate}/hr` : "No rate set"}</TableCell>
								<TableCell>
									{task.projects.length > 0 ? (
										<div className="space-y-1">
											{task.projects.map((project) => (
												<div key={project.id} className="text-sm">
													<span className="font-medium">{project.name}</span>
													<span className="text-muted-foreground"> ({project.customer.name})</span>
												</div>
											))}
										</div>
									) : (
										<span className="text-muted-foreground">Not assigned</span>
									)}
								</TableCell>
								<TableCell>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												// TODO: Implement edit functionality
												toast.info("Edit functionality coming soon!");
											}}
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDeleteTask(task.id, task.name)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export default TasksPage;
