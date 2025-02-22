"use client";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import RecentTransactions from "@/components/RecentTransactions";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { useEffect, Suspense, useState } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Skeleton } from "@radix-ui/themes";
import { ErrorBoundary } from "react-error-boundary";

function ClientHomeContent({ userId }: { userId: string }) {
	const { data: plaidData, isLoading: isPlaidLoading, error: plaidError } = usePlaidBanks(userId);
	const { toast } = useToast();
	const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
	const [endDate, setEndDate] = useState(new Date());
	const totalBanks = plaidData?.totalBanks || 0;
	const totalCurrentBalance = plaidData?.totalCurrentBalance || 0;

	const query = usePlaidTransactions(userId);

	const transactions = query.transactions || [];

	const accounts = plaidData?.accounts || [];

	useEffect(() => {
		if (plaidError || !transactions) {
			toast({
				variant: "destructive",
				title: "Error",
				description: plaidError?.message || "An error occurred while fetching data.",
			});
		}
	}, [plaidError, toast]);

	if (isPlaidLoading || query.isLoading) {
		return <Skeleton className="w-full h-full" />;
	}

	return (
		<div>
			<TotalBalanceBox accounts={accounts} totalBanks={totalBanks} totalCurrentBalance={totalCurrentBalance} />
			<RecentTransactions startDate={startDate.toISOString()} endDate={endDate.toISOString()} accounts={accounts} userId={userId} />
		</div>
	);
}

function FallbackComponent() {
	return (
		<div className="p-4">
			<TotalBalanceBox accounts={[]} totalBanks={0} totalCurrentBalance={0} />
		</div>
	);
}

export default function ClientHome({ userId }: { userId: string }) {
	return (
		<ErrorBoundary FallbackComponent={FallbackComponent}>
			<Suspense fallback={<Skeleton className="w-full h-full" />}>
				<ClientHomeContent userId={userId} />
			</Suspense>
		</ErrorBoundary>
	);
}
