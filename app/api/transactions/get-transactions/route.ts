import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import prisma from "@/prisma/client";
import { Transaction } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;

		// Extract and validate dates
		const startDateParam = searchParams.get("startDate");
		const endDateParam = searchParams.get("endDate");
		console.log("Received date parameters:", {
			startDateParam,
			endDateParam,
			parsedStartDate: new Date(startDateParam!),
			parsedEndDate: new Date(endDateParam!),
		});
		if (!startDateParam || !endDateParam) {
			return NextResponse.json({ error: "Both startDate and endDate are required" }, { status: 400 });
		}

		const startDate = new Date(startDateParam);
		const endDate = new Date(endDateParam);

		console.log("Date range for Plaid request:", {
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			currentYear: new Date().getFullYear(),
			isStartDateFuture: startDate > new Date(),
			isEndDateFuture: endDate > new Date(),
		});

		// Check if the dates are valid
		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			return NextResponse.json({ error: "Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)" }, { status: 400 });
		}

		const userId = searchParams.get("userId");
		const bankIds = searchParams.get("bankIds")?.split(",");

		if (!userId) {
			return NextResponse.json({ error: "UserId is required" }, { status: 400 });
		}

		const banksQuery = {
			where: {
				userId,
				...(bankIds && bankIds.length > 0 ? { accountId: { in: bankIds } } : {}),
			},
			select: {
				id: true,
				bankId: true,
				accessToken: true,
				accountId: true,
				institutionName: true,
			},
		};

		const banks = await prisma.bank.findMany(banksQuery);
		if (!banks.length) {
			return NextResponse.json({ transactions: [] });
		}

		let allTransactions = new Map();

		// Inside your try block, replace the existing Plaid API call with:

		for (const bank of banks) {
			try {
				console.log(`Fetching transactions for bank:`, {
					bankId: bank.id,
					institutionName: bank.institutionName,
					accountId: bank.accountId,
				});

				let fetchedTransactions: any[] = [];
				let hasMore = true;
				let offset = 0;

				while (hasMore) {
					const plaidResponse = await plaidClient.transactionsGet({
						access_token: bank.accessToken,
						start_date: startDate.toISOString().split("T")[0],
						end_date: endDate.toISOString().split("T")[0],
						options: {
							include_personal_finance_category: true,
							offset: offset,
							count: 500, // Plaid's maximum per request
						},
					});

					const mappedTransactions = plaidResponse.data.transactions.map((transaction) => ({
						id: transaction.transaction_id,
						name: transaction.name,
						paymentChannel: transaction.payment_channel,
						type: transaction.payment_channel,
						accountId: transaction.account_id,
						amount: transaction.amount * -1,
						pending: transaction.pending,
						category: transaction.personal_finance_category?.primary ?? "uncategorized",
						date: transaction.date,
						image: transaction.logo_url ?? "",
						bankId: bank.id,
						institutionName: bank.institutionName,
						// Add these if they're required by your Transaction type
						senderBankId: bank.id,
						receiverBankId: bank.id,
					}));

					fetchedTransactions = [...fetchedTransactions, ...mappedTransactions];
					hasMore = plaidResponse.data.total_transactions > fetchedTransactions.length;
					offset = fetchedTransactions.length;
				}

				// Add transactions to the Map
				fetchedTransactions.forEach((transaction) => {
					allTransactions.set(transaction.id, transaction);
				});

				console.log(`Bank ${bank.institutionName} (${bank.id}) results:`, {
					totalTransactions: fetchedTransactions.length,
					accountIds: [...new Set(fetchedTransactions.map((t) => t.accountId))],
				});
			} catch (error: any) {
				console.error(`Error fetching transactions for bank ${bank.institutionName}:`, {
					bankId: bank.id,
					error: error.response?.data || error.message,
				});
				continue;
			}
		}

		const uniqueTransactions = Array.from(allTransactions.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		console.log("Final transaction summary:", {
			totalBanks: banks.length,
			totalTransactions: uniqueTransactions.length,
			transactionsByBank: uniqueTransactions.reduce((acc, t) => {
				acc[t.institutionName] = (acc[t.institutionName] || 0) + 1;
				return acc;
			}, {} as Record<string, number>),
			uniqueAccountIds: [...new Set(uniqueTransactions.map((t) => t.accountId))],
		});

		return NextResponse.json({ transactions: uniqueTransactions });
	} catch (error: any) {
		console.error("Error fetching transactions: ", error);
		return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
	}
}
