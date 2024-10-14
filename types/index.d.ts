/* eslint-disable no-unused-vars */

declare type SearchParamProps = {
	params: { [key: string]: string };
	searchParams: { [key: string]: string | string[] | undefined };
};

// ========================================

declare type SignUpParams = {
	firstName: string;
	lastName: string;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	dob: string;
	ssn: string;
	email: string;
	password: string;
};

declare type LoginUser = {
	id: number;
	email: string;
	password: string;
};

declare type User = {
	id?: number | string;
	$id?: string | null;
	email: string;
	userId?: string | null;
	dwollaCustomerUrl?: string | null;
	dwollaCustomerId?: ?(string | null);
	firstName?: string | null;
	lastName?: string | null;
	name?: string | null;
	address?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	dateOfBirth?: string | null;
	ssn?: string | null;
};

declare type NewUserParams = {
	userId: string;
	email: string;
	name: string;
	password: string;
};

declare type Account = {
	id: string;
	availableBalance: number;
	currentBalance: number;
	officialName: string;
	mask: string;
	institutionId: string;
	name: string;
	type: string;
	subtype: string;
	appwriteItemId: string;
	sharableId: string;
};

declare type Transaction = {
	id: string;
	$id: string;
	name: string;
	paymentChannel: string;
	type: string;
	accountId: string;
	amount: number;
	pending: boolean;
	category: string;
	date: string;
	image: string;
	type: string;
	$createdAt: string;
	channel: string;
	senderBankId: string;
	receiverBankId: string;
};

declare type Bank = {
	$id: string;
	accountId: string;
	bankId: string;
	accessToken: string;
	fundingSourceUrl: string;
	userId: string;
	sharableId: string;
};

declare type AccountTypes = "depository" | "credit" | "loan " | "investment" | "other";

declare type Category = "Food and Drink" | "Travel" | "Transfer";

declare type CategoryCount = {
	name: string;
	count: number;
	totalCount: number;
};

declare type Receiver = {
	firstName: string;
	lastName: string;
};

declare type TransferParams = {
	sourceFundingSourceUrl: string;
	destinationFundingSourceUrl: string;
	amount: string;
};

declare type AddFundingSourceParams = {
	dwollaCustomerUrl: string;
	dwollaCustomerId: string;
	processorToken: string;
	bankName: string;
};

declare type NewDwollaCustomerParams = {
	firstName: string;
	lastName: string;
	email: string;
	type: string;
	address1: string;
	city: string;
	state: string;
	postalCode: string;
	dateOfBirth: string;
	ssn: string;
};

declare interface CreditCardProps {
	account: Account;
	userName: string;
	showBalance?: boolean;
}

declare interface BankInfoProps {
	account: Account;
	appwriteItemId?: string;
	type: "full" | "card";
}

declare interface HeaderBoxProps {
	type?: "title" | "greeting";
	title: string;
	subtext: string;
	user?: string;
}

declare interface MobileNavProps {
	user: User;
}

declare interface PageHeaderProps {
	topTitle: string;
	bottomTitle: string;
	topDescription: string;
	bottomDescription: string;
	connectBank?: boolean;
}

declare interface PaginationProps {
	page: number;
	totalPages: number;
}

export interface PlaidLinkProps {
	user: User;
	variant?: "primary" | "ghost";
	dwollaCustomerId?: string;
}

// declare type User = sdk.Models.Document & {
//   accountId: string;
//   email: string;
//   name: string;
//   items: string[];
//   accessToken: string;
//   image: string;
// };

declare interface AuthFormProps {
	type: "sign-in" | "sign-up";
}

declare interface BankDropdownProps {
	accounts: Account[];
	setValue?: UseFormSetValue<any>;
	otherStyles?: string;
}

declare interface BankTabItemProps {
	account: Account;
	appwriteItemId?: string;
}

declare interface TotlaBalanceBoxProps {
	accounts: Account[];
	totalBanks: number;
	totalCurrentBalance: number;
}

declare interface FooterProps {
	user: User | null;
}

declare interface RightSidebarProps {
	user: User;
	transactions: Transaction[];
	banks: Bank[] & Account[];
}

declare interface SiderbarProps {
	user?: User | null;
}

declare interface RecentTransactionsProps {
	accounts: Account[];
	transactions: Transaction[];
	appwriteItemId: string;
	page: number;
}

declare interface TransactionHistoryTableProps {
	transactions: Transaction[];
	page: number;
}

declare interface CategoryBadgeProps {
	category: string;
}

declare interface TransactionTableProps {
	transactions: Transaction[];
}

declare interface CategoryProps {
	category: CategoryCount;
}

declare interface DoughnutChartProps {
	accounts: Account[];
}

declare interface PaymentTransferFormProps {
	accounts: Account[];
}

// Actions
declare interface getAccountsProps {
	userId: string;
}

declare interface getAccountProps {
	appwriteItemId: string;
}

declare interface getInstitutionProps {
	institutionId: string;
}

declare interface getTransactionsProps {
	accessToken: string;
}

declare interface CreateFundingSourceOptions {
	customerId: string; // Dwolla Customer ID
	customerUrl: string; //Dwolla Customer URL
	fundingSourceName: string; // Dwolla Funding Source Name
	plaidToken: string; // Plaid Account Processor Token
	_links: object; // Dwolla On Demand Authorization Link
}

declare interface CreateTransactionProps {
	name: string;
	amount: string;
	senderId: string;
	senderBankId: string;
	receiverId: string;
	receiverBankId: string;
	email: string;
}

declare interface getTransactionsByBankIdProps {
	bankId: string;
}

declare interface signInProps {
	email: string;
	password: string;
}

declare interface getUserInfoProps {
	userId: string;
}

declare interface exchangePublicTokenProps {
	publicToken: string;
	user: User;
}

declare interface createBankAccountProps {
	accessToken: string;
	userId: string;
	accountId: string;
	bankId: string;
	fundingSourceUrl: string;
	sharableId: string;
}

declare interface getBanksProps {
	userId: string;
}

declare interface getBankProps {
	documentId: string;
}

declare interface getBankByAccountIdProps {
	accountId: string;
}

export interface Customer {
	id: number;
	name: string;
	email: string;
	dateCreated: string;
	defaultRate: number;
	color: string | null;
	paymentTerms: string | null;
	shortName: string | null;
}

export interface Project {
	id: number;
	name: string;
	customerId: number;
	dateCreated: string;
	description: string | null; // Changed from string | undefined to string | null
	rate: number | null;
}

export interface Task {
	id: number;
	name: string;
	projectId: number;
	dateCreated: string;
	description: string | null; // Changed from string | undefined to string | null
	rate: number | null;
}

export interface TimeEntryBase {
	id: number;
	description: string | null;
	duration: number;
	date: string;
	userId: number;
	taskId: number;
	customerId: number;
	projectId: number;
	invoiceItemId: number | null;
	invoiceId: number | null;
	isInvoiced: boolean;
}

export interface TimeEntryData extends TimeEntryBase {
	Customer?: Partial<Customer> | null;
	Project?: Partial<Project> | null;
	Task?: Partial<Task> | null;
	User?: Partial<User> | null; // Change this line
	startTime?: string;
	endTime?: string;
	// Additional properties for rendering
	width?: number;
	left?: number;
	startSlot?: number;
	endSlot?: number;
}

export interface TimeEntry extends Omit<TimeEntryData, "date"> {
	date: Date; // Convert to Date for frontend use
	name: string;
	Customer: Customer;
	Project: Project;
	Task: Task;
}
export interface TimeEntryProps {
	entry: TimeEntry;
	startSlot: number;
	endSlot: number;
	dayIndex: number;
	color: string;
	width: number;
	left: number;
}

export interface TimeGridProps {
	filters: {
		startDate?: Date;
		endDate?: Date;
		customerId?: number;
	};
}

export interface PdfData {
	invoiceNumber?: string;
	paymentTerms: string | null;
	timeEntries: TimeEntry[];
}

export interface TableRow {
	[key: string]: string | number;
	date: string;
	projectName: string;
	description: string;
	hours: number;
	rate: number;
	amount: number;
}
