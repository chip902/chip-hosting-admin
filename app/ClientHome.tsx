"use client";
import { useDwollaAccounts } from "@/app/hooks/useDwollaAccounts";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import RecentTransactions from "@/components/RecentTransactions";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Skeleton } from "@radix-ui/themes";

interface ClientHomeProps {
	userId: string;
}

export default function ClientHome({ userId }: ClientHomeProps) {
	const { data: dwollaAccounts, isLoading: isDwollaLoading, error: dwollaError } = useDwollaAccounts(userId);
	const { data: plaidData, isLoading: isPlaidLoading, error: plaidError } = usePlaidBanks(userId);
	const { data: transactions, isLoading: isTransactionsLoading, error: transactionsError } = usePlaidTransactions(userId);
	const { toast } = useToast();

	const accounts = plaidData?.accounts || [];
	const totalBanks = plaidData?.totalBanks || 0;
	const totalCurrentBalance = plaidData?.totalCurrentBalance || 0;

	useEffect(() => {
		if (dwollaError || plaidError || transactionsError) {
			toast({
				variant: "destructive",
				title: "Error",
				description: dwollaError?.message || plaidError?.message || transactionsError?.message || "An error occurred while fetching data.",
			});
		}
	}, [dwollaError, plaidError, transactionsError, toast]);

	if (isDwollaLoading || isPlaidLoading || isTransactionsLoading) {
		return (
			<Skeleton className="w-full h-full">
				Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ratione nulla tempore repellat laudantium dolorum iusto saepe assumenda fugiat eum
				minus. Vel repellat nulla libero suscipit ipsam aut, id quis corrupti. Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure non, dolore
				quas suscipit nesciunt commodi blanditiis sed facilis voluptate, voluptatem maxime tempore, accusantium quisquam beatae velit possimus omnis
				natus facere! Impedit qui tenetur molestiae minus aliquam maxime eaque voluptas, fugiat repellat similique voluptatem. Quam repellendus ullam
				deleniti non veniam cum incidunt, neque nihil impedit doloremque, veritatis mollitia blanditiis modi numquam! Impedit, modi veritatis corporis
				laudantium expedita enim! Voluptatem laborum ullam minima dignissimos odio dolores ipsam molestias itaque reprehenderit sapiente perspiciatis,
				illo vel possimus, alias totam dolore quis qui ad natus! Itaque nam accusantium dicta sapiente consequuntur id, labore sed natus architecto
				dolorem nisi nihil soluta repellendus temporibus voluptatum saepe. Et harum perferendis, ut esse rerum optio molestiae vitae! Magnam, corporis!
				Expedita dolor officia dolores sequi repellendus eum, earum ullam voluptatem, illo suscipit corrupti. Eius, necessitatibus eligendi? Numquam,
				quasi? Dolores ipsam quasi omnis! Cum dolor perferendis saepe tempore sequi, quod magni. Dignissimos qui similique provident voluptates labore
				quo, pariatur, culpa, voluptas cumque fugit mollitia autem. Eaque illum tenetur maiores quo quasi ad. Sequi deleniti tempore veritatis tenetur
				iusto, et beatae sapiente. Natus, eligendi vitae nihil error numquam similique beatae?
			</Skeleton>
		);
	}
	return (
		<>
			<TotalBalanceBox accounts={accounts} totalBanks={totalBanks} totalCurrentBalance={totalCurrentBalance} />
			<RecentTransactions accounts={accounts} transactions={transactions || []} />
		</>
	);
}
