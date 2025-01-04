"use client";
import React from "react";
import PlaidLink from "./PlaidLink";
import BankCard from "./BankCard";
import { User } from "@/types";
import { useToast } from "@/app/hooks/useToast";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";

interface BankCardsProps {
	user: User;
}

const BankCards: React.FC<BankCardsProps> = ({ user }) => {
	const { data: plaidData, isLoading: isPlaidLoading, error: plaidError } = usePlaidBanks(user.userId);
	const { data: transactions, isLoading: isTransactionsLoading, error: transactionsError } = usePlaidTransactions(user.userId);
	const { toast } = useToast();

	const accounts = plaidData?.accounts || [];
	const totalBanks = plaidData?.totalBanks || 0;
	return (
		<section className="banks">
			<div className="flex w-full justify-between">
				<h2 className="header-2">My Banks</h2>
				<PlaidLink user={user} variant="primary" />
			</div>

			{accounts?.length > 0 && (
				<div className="relative flex flex-1 flex-col items-center justify-center gap-5">
					<div className="relative z-10">
						<BankCard key={accounts[0].id} account={accounts[0]} userName={`${user.firstName || ""} ${user.lastName || ""}`} showBalance={false} />
					</div>
					{accounts[1] && (
						<div className="absolute right-0 top-8 z-0 w-[90%]">
							<BankCard
								key={accounts[1].id}
								account={accounts[1]}
								userName={`${user.firstName || ""} ${user.lastName || ""}`}
								showBalance={false}
							/>
						</div>
					)}
				</div>
			)}
		</section>
	);
};

export default BankCards;
