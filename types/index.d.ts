/* eslint-disable no-unused-vars */
import { PersonalFinanceCategory } from "plaid";
export type SearchParamProps = {
	params: { [key: string]: string };
	searchParams: { [key: string]: string | string[] | undefined };
};

export type SignUpParams = {
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

export type LoginUser = {
	id: number;
	email: string;
	password: string;
};

export type User = {
	id?: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
	userId?: string | null;
	dwollaCustomerUrl?: string | null;
	dwollaCustomerId?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	address?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	dateOfBirth?: string | null;
	ssn?: string | null;
};

export type NewUserParams = {
	userId: string;
	email: string;
	name: string;
	password: string;
};

export interface Account {
	id: string;
	availableBalance: number;
	currentBalance: number;
	institutionId: string | number;
	name: string;
	officialName: string | null;
	mask: string;
	type: string;
	subtype: string;
	bankId: string;
	sharableId: string;
}

export interface AccountBase {
	id: string;
	availableBalance: number;
	currentBalance: number;
	name: string;
	officialName: string;
	institution_id?: number; // Assuming this might not always be present, hence it is optional.
}

export interface BankAccount extends AccountBase {
	institutionId: number; // For properties only available in some accounts, consider adding them to the extension interface.
}

export interface GetAccountsResult {
	accounts: Account[];
	totalBanks: number;
	totalCurrentBalance: number;
}

export type Transaction = {
	id: string;
	$id: string;
	name: string;
	paymentChannel: string;
	type: string;
	accountId: string;
	amount: number;
	pending: boolean;
	category: string | PersonalFinanceCategory;
	date: string;
	image: string;
	$createdAt: string;
	channel: string;
	senderBankId: string;
	receiverBankId: string;
};

export type Bank = {
	$id: string;
	accountId: string;
	bankId: string;
	accessToken: string;
	fundingSourceUrl: string;
	userId: string;
	sharableId: string;
};

export type AccountTypes = "depository" | "credit" | "loan" | "investment" | "other";

export type Category = "Food and Drink" | "Travel" | "Transfer";

export type CategoryCount = {
	name: string;
	count: number;
	totalCount: number;
};

export type Receiver = {
	firstName: string;
	lastName: string;
};

export type TransferParams = {
	sourceFundingSourceUrl: string;
	destinationFundingSourceUrl: string;
	amount: string;
};

export type AddFundingSourceParams = {
	dwollaCustomerUrl: string;
	dwollaCustomerId: string;
	processorToken: string;
	bankName: string;
};

export type NewDwollaCustomerParams = {
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

export interface CreditCardProps {
	account: Account;
	userName: string;
	showBalance?: boolean;
}

export interface BankInfoProps {
	account: Account;
	appwriteItemId?: string;
	type: "full" | "card";
}

export interface HeaderBoxProps {
	type?: "title" | "greeting";
	title: string;
	subtext: string;
	user?: string;
}

export interface MobileNavProps {
	user: User;
}

export interface PageHeaderProps {
	topTitle: string;
	bottomTitle: string;
	topDescription: string;
	bottomDescription: string;
	connectBank?: boolean;
}

export interface PaginationProps {
	page: number;
	totalPages: number;
}

export interface PlaidLinkProps {
	user: User;
	variant?: "primary" | "ghost";
	dwollaCustomerId?: string;
}

export interface AuthFormProps {
	type: "sign-in" | "sign-up";
}

export interface BankDropdownProps {
	accounts: Account[];
	setValue?: UseFormSetValue<any>;
	otherStyles?: string;
}

export interface BankTabItemProps {
	account: Account;
	appwriteItemId?: string;
}

export interface TotalBalanceBoxProps {
	accounts: Account[];
	totalBanks: number;
	totalCurrentBalance: number;
}

export interface FooterProps {
	user: User | null;
}

export interface RightSidebarProps {
	user: User;
	transactions: Transaction[];
	banks: Bank[] & Account[];
}

export interface SiderbarProps {
	user?: User | null;
}

export interface RecentTransactionsProps {
	accounts: Account[];
	transactions: Transaction[];
	page?: number;
}

export interface TransactionHistoryTableProps {
	transactions: Transaction[];
	page: number;
}

export interface CategoryBadgeProps {
	category: string;
}

export interface TransactionTableProps {
	transactions: Transaction[];
}

export interface CategoryProps {
	category: CategoryCount;
}

export interface DoughnutChartProps {
	accounts: Account[];
}

export interface PaymentTransferFormProps {
	accounts: Account[];
}

export interface GetAccountsProps {
	userId: string;
}

export interface GetAccountsResult {
	accounts: Account[];
	totalBanks: number;
	totalCurrentBalance: number;
}

export interface GetAccountProps {
	bankId: string;
}

export interface GetInstitutionProps {
	institutionId: string;
}

export interface GetTransactionsProps {
	accessToken: string;
}

export interface CreateFundingSourceOptions {
	customerId: string;
	customerUrl: string;
	fundingSourceName: string;
	plaidToken: string;
	_links: object;
}

export interface CreateTransactionProps {
	name: string;
	amount: string;
	senderId: string;
	senderBankId: string;
	receiverId: string;
	receiverBankId: string;
	email: string;
}

export interface GetTransactionsByBankIdProps {
	bankId: string;
}

export interface SignInProps {
	email: string;
	password: string;
}

export interface GetUserInfoProps {
	userId: string;
}

export interface ExchangePublicTokenProps {
	publicToken: string;
	user: User;
}

export interface CreateBankAccountProps {
	accessToken: string;
	userId: string;
	accountId: string;
	bankId: string;
	fundingSourceUrl: string;
	sharableId: string;
}

export interface GetBanksProps {
	userId: string;
}

export interface GetBankProps {
	bankId: string;
}

export interface GetBankByAccountIdProps {
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
	description: string | null;
	rate: number | null;
}

export interface Task {
	id: number;
	name: string;
	projectId: number;
	dateCreated: string;
	description: string | null;
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
	User?: Partial<User> | null;
	startTime?: string;
	endTime?: string;
	width?: number;
	left?: number;
	startSlot?: number;
	endSlot?: number;
}

export interface TimeEntry extends Omit<TimeEntryData, "date"> {
	date: Date;
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
