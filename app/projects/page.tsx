"use client";
import { Flex, Table } from "@radix-ui/themes";
import AddDocument from "./AddDocument";
import EditDocument from "./EditDocument";
import { Project } from "@prisma/client";
import { useProjects } from "../hooks/useProjects";

const CustomerTable = () => {
	const { data: projects } = useProjects();
	return (
		<>
			<Flex justify="end" p="3px" my="3">
				<AddDocument />
			</Flex>
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>Project Name</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Project Description</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Project Rate</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>xxx</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell />
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{projects?.map((project) => {
						const projectData: Project = {
							id: project.id,
							customerId: project.customerId,
							name: project.name ?? null,
							description: project.description,
							dateCreated: new Date(project.dateCreated),
							rate: project.rate || null,
						};

						return (
							<Table.Row key={projectData.id}>
								<Table.RowHeaderCell>{projectData.name}</Table.RowHeaderCell>
								<Table.Cell>{projectData.description}</Table.Cell>
								<Table.Cell>${projectData.rate}</Table.Cell>
								<Table.Cell>
									<Flex justify="center">
										<EditDocument project={projectData} />
									</Flex>
								</Table.Cell>
							</Table.Row>
						);
					})}
				</Table.Body>
			</Table.Root>
		</>
	);
};

export default CustomerTable;
