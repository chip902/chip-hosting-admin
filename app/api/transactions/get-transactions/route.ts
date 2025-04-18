// app/api/transactions/get-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;

		// 1) Validate date range
		const startDateParam = searchParams.get("startDate");
		const endDateParam = searchParams.get("endDate");
		if (!startDateParam || !endDateParam) {
			return NextResponse.json({ error: "Both startDate and endDate are required" }, { status: 400 });
		}
		const startDate = new Date(startDateParam);
		const endDate = new Date(endDateParam);
		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
		}

		// 2) Validate userId
		const userId = searchParams.get("userId");
		if (!userId) {
			return NextResponse.json({ error: "UserId is required" }, { status: 400 });
		}

		// 3) Which aggregator account IDs are requested?
		const bankIds = searchParams.get("bankIds")?.split(",");

		// 4) Find matching DB rows. If bankIds is empty, it won't filter by accountId
		const banks = await prisma.bank.findMany({
			where: {
				userId,
				...(bankIds?.length ? { accountId: { in: bankIds } } : {}),
			},
			select: {
				id: true,
				bankId: true,
				accessToken: true,
				accountId: true,
				institutionName: true,
			},
		});

		if (!banks.length) {
			// No matching banks => no transactions
			return NextResponse.json({ transactions: [] });
		}

		// This will hold all unique transactions
		const allTransactions = new Map<string, any>();

		// 5) For each row, call Plaid's transactionsGet
		for (const bank of banks) {
			try {
				let fetchedTransactions: any[] = [];
				let hasMore = true;
				let offset = 0;

				while (hasMore) {
					const plaidResponse = await plaidClient.transactionsGet({
						access_token: bank.accessToken,
						start_date: startDate.toISOString().split("T")[0], // "2024-01-01"
						end_date: endDate.toISOString().split("T")[0], // "2024-04-30"
						options: {
							include_personal_finance_category: true,
							offset,
							count: 500,
							account_ids: [bank.accountId], // Restrict to this single aggregator account
						},
					});

					fetchedTransactions = fetchedTransactions.concat(plaidResponse.data.transactions);

					hasMore = plaidResponse.data.total_transactions > fetchedTransactions.length;
					offset = fetchedTransactions.length;
				}

				// Convert to your local shape
				for (const t of fetchedTransactions) {
					allTransactions.set(t.transaction_id, {
						id: t.transaction_id,
						name: t.name,
						paymentChannel: t.payment_channel,
						type: t.payment_channel,
						accountId: t.account_id,
						amount: t.amount * -1,
						pending: t.pending,
						category: t.personal_finance_category?.primary ?? "uncategorized",
						date: t.date,
						image: t.logo_url ?? "",
						bankId: bank.id,
						institutionName: bank.institutionName,
						senderBankId: bank.id,
						receiverBankId: bank.id,
					});
				}
			} catch (err: any) {
				console.error(`Error fetching transactions for bank ID ${bank.id}:`, err?.response?.data || err.message);
			}
		}

		// Convert map to array & sort desc by date
		const uniqueTransactions = Array.from(allTransactions.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		return NextResponse.json({ transactions: uniqueTransactions });
	} catch (error: any) {
		console.error("Server error in get-transactions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch transactions" },
			{
				status: 500,
			}
		);
	}
}
