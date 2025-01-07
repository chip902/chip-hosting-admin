/* eslint-disable no-unused-vars */
import { PersonalFinanceCategory } from "plaid";
import { User as AuthUser } from "./next-auth.d.ts";

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

export interface User {
	id: number | string;
	userId?: string;
	userToken?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	passwordHash?: string;
	createdAt?: Date;
	updatedAt?: Date;
	dateCreated?: Date;
	sessionTokens?: Session[];
	authenticators?: Authenticator[];
	verificationTokens?: VerificationToken[];
	banks?: Bank[];
	timeEntries?: TimeEntry[];
	projects?: Project[];
}

export type NewUserParams = {
	userId: string;
	email: string;
	name: string;
	password: string;
};

export interface Balances {
	available: number | null;
	current: number;
	iso_currency_code: string;
	limit: number | null;
	unofficial_currency_code: string | null;
}

export interface Balances {
	available: number | null;
	current: number;
	iso_currency_code: string;
	limit: number | null;
	unofficial_currency_code: string | null;
}

export interface Account {
	id: string;
	bankId: string | null;
	account_id: string;
	balances: Balances;
	institution_id: string | null;
	mask: string;
	name: string;
	official_name: string | null;
	subtype: string;
	type: string;
	availableBalance: number | null;
	currentBalance: number | null;
}

export interface Institution {
	institution_id: string;
	name: string;
}

export interface GetAccountsResult {
	accounts: Account[];
	totalBanks: number;
	totalCurrentBalance: number;
}

export type Transaction = {
	id: string;
	name: string;
	paymentChannel: string;
	type: string;
	accountId: string;
	amount: number;
	pending: boolean;
	category: string | PersonalFinanceCategory;
	date: string;
	image: string;
};

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
	userId: string;
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
	user: AuthUser;
	variant?: "primary" | "ghost";
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
	transactionId?: string;
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
	user: User | null;
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
	filterByBank?: boolean;
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
	dateCreated: Date;
	defaultRate: number;
	color?: string;
	shortName?: string;
	paymentTerms?: string;
	invoices?: Invoice[];
	projects?: Project[];
	timeEntries?: TimeEntry[];
}

export interface ProjectTasks {
	projectId: number;
	taskId: number;
	project: Project;
	task: Task;
}

export interface Project {
	id: number;
	name: string;
	description?: string;
	customerId: number;
	dateCreated: Date;
	rate?: number;
	customer: Customer;
	projectTasks?: ProjectTasks[];
	tasks: Task[];
	users: User[];
	timeEntries?: TimeEntry[];
}

export interface Task {
	id: number;
	name: string;
	description?: string;
	dateCreated: Date;
	rate?: number;
	projectTasks?: ProjectTasks[];
	timeEntries?: TimeEntry[];
	projects: Project[];
}

export interface TimeEntry {
	startTime: string;
	endTime: string;
	id: number;
	description?: string;
	duration: number;
	date: Date;
	userId: number;
	taskId: number;
	customerId: number;
	projectId: number;
	invoiceItemId?: number | null;
	invoiceId?: number | null;
	isInvoiced: boolean;

	// Relations to other models
	customer: CustomerType;
	project: ProjectType;
	task: TaskType;
	user: UserType;
	invoice?: Invoice;
	invoiceItem?: InvoiceItem;
}

export interface TimeEntryData {
	duration: number;
	name: string;
	start: string | Date;
	end: string;
	id: number;
	date: string;
	startTime: string;
	endTime: string;
	customerName: string;
	customer: { name: string; defaultRate: number };
	project: { name: string; rate: number };
	task: { name: string };
	user: { name?: string; id: number };
	isClientInvoiced: boolean;
	description?: string;
}

export interface UpdateTimeEntryParams {
	id: number;
	data: Partial<TimeEntryData>;
}

export interface DeleteTimeEntryParams {
	id: number;
}

export interface ProcessedTimeSlot {
	width: number;
	left: number;
	startSlot: number;
	endSlot: number;
	date: Date;
	dayIndex: number;
	color: string;
	entry: ProcessedTimeEntry; // Ensure this is the full object
}

export interface TimeEntryProps {
	date: Date;
	startSlot: number;
	endSlot: number;
	dayIndex: number;
	color: string;
	width: number;
	left: number;
	entry: ProcessedTimeEntry; // Use ProcessedTimeEntry which includes both base and UI-specific data
}

export interface RawTimeEntry {
	id: number;
	date: Date | string;
	startTime: string;
	endTime: string;
	customer?: { name: string };
	project: { name: string };
	task: { name: string };
	isInvoiced: boolean;
	isClientInvoiced: boolean;
	isBillable: boolean;
	color: string;
	name?: string;
	description?: string;
	startSlot: number;
	endSlot: number;
}

export interface ProcessedTimeEntry {
	id: number;
	date: Date | string;
	startTime: string;
	endTime: string;
	customer: { name: string };
	project: { name: string };
	task: { name: string };
	isInvoiced: boolean | null;
	isBillable: boolean | null;
	color: string;
	name: string;
	customerName?: string;
	projectName?: string;
	taskName?: string;
	width?: number;
	left?: number;
	startSlot?: number | null;
	endSlot?: number | null;
	duration: number;
	description?: string;
}

export interface GridItem {
	width: number;
	left: number;
	startSlot: number;
	endSlot: number;
	date: Date;
	dayIndex: number;
	color: string;
	entry: ProcessedTimeEntry;
	customerName: string;
}

interface TimeGridProps {
	filters: {
		startDate?: Date;
		endDate?: Date;
		customerId?: number;
	};
	onTimeSlotSelect: (
		timeSlot: {
			date?: Date;
			startTime?: string;
			endTime?: string;
			duration?: number;
		} | null
	) => void;
}

export interface PdfData {
	invoiceNumber?: string;
	paymentTerms: string | null;
	timeEntries: TimeEntryData[];
}

export interface PdfTimeEntry extends TimeEntry {
	name: string;
	Customer: { name: string; email: string };
	Project: { name: string };
	Task: { name: string };
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

export interface Invoice {
	id: number;
	customerId: number;
	totalAmount: number;
	dateCreated: Date;
	pdfPath?: string;
	customer: Customer;
	invoiceItems?: InvoiceItem[];
	timeEntries?: TimeEntry[];
}
