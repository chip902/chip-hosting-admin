import React from "react";
import AnimatedCounter from "./AnimatedCounter";
import DoughnutChart from "./DoughnutChart";
import { TotalBalanceBoxProps } from "@/types";

const TotalBalanceBox: React.FC<TotalBalanceBoxProps> = ({ accounts, totalBanks, totalCurrentBalance }) => {
	return (
		<section className="total-balance">
			<div className="total-balance-chart">
				<DoughnutChart accounts={accounts} />
			</div>
			<div className="flex flex-col gap-6">
				<header className="header-2">Bank Accounts: {totalBanks}</header>
				<div className="flex flex-col gap-2">
					<p className="total-balance-label">Total Current Balance</p>
					<div className="total-balance-amount flex-center gap-2">
						<AnimatedCounter amount={totalCurrentBalance} />
					</div>
				</div>
			</div>
		</section>
	);
};

export default TotalBalanceBox;
