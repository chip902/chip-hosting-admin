import React from "react";
import { Button } from "@/components/ui/button";
import EditDocument from "./EditDocument";
import { Project } from "@prisma/client";

interface ProjectActionsProps {
	project: {
		id: number;
		name: string;
		customerId: number;
		description: string;
		rate: number;
		archived: boolean;
		dateCreated: Date;
	};
	onArchive: (project: Project) => void;
}

const ProjectActions = ({ project, onArchive }: ProjectActionsProps) => {
	return (
		<div className="flex items-center gap-2 justify-end">
			<EditDocument project={project} />
			<Button variant="ghost" size="sm" onClick={() => onArchive(project)} className="text-red-600 hover:text-red-900">
				Archive
			</Button>
		</div>
	);
};

export default ProjectActions;
