// mockData.ts
export const mockCustomers = [
	{
		id: 1,
		name: "Acme Corp",
		email: "contact@acme.com",
		dateCreated: new Date(),
		defaultRate: 50.0,
		color: "#FF5733",
		shortName: "AC",
	},
	{
		id: 2,
		name: "Beta Inc.",
		email: "support@beta.com",
		dateCreated: new Date(),
		defaultRate: 75.0,
		color: "#33A2FF",
		shortName: "BI",
	},
];

export const mockProjects = [
	{
		id: 1,
		name: "Website Redesign",
		customerId: 1,
		dateCreated: new Date(),
		rate: 60.0,
	},
	{
		id: 2,
		name: "Backend Development",
		customerId: 2,
		dateCreated: new Date(),
		rate: 70.0,
	},
];

export const mockTimeEntries = [
	{
		id: 1,
		description: "Design Homepage",
		duration: 120,
		date: new Date("2023-08-19"),
		userId: 1,
		customerId: 1,
		projectId: 1,
		isInvoiced: false,
	},
	{
		id: 2,
		description: "Develop API",
		duration: 180,
		date: new Date("2023-08-20"),
		userId: 2,
		customerId: 2,
		projectId: 2,
		isInvoiced: false,
	},
];

export const mockInvoices = [
	{
		id: 1,
		customerId: 1,
		totalAmount: 300.0,
		dateCreated: new Date(),
		pdfPath: "/invoices/1.pdf",
	},
	{
		id: 2,
		customerId: 2,
		totalAmount: 450.0,
		dateCreated: new Date(),
		pdfPath: "/invoices/2.pdf",
	},
];
