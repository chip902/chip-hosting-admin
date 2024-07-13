// types.ts
export interface Task {
	id: number;
	name: string;
	description?: string;
	projectId: number;
	dateCreated: string;
	rate?: number;
}

export interface Project {
	id: number;
	name: string;
	description?: string;
	customerId: number;
	dateCreated: string;
	rate?: number;
}

export interface Customer {
	id: number;
	name?: string;
	email: string;
	dateCreated: string;
	defaultRate: number;
	color: string;
}
