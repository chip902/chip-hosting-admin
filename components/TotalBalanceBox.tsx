import React from "react";
import AnimatedCounter from "./AnimatedCounter";
import DoughnutChart from "./DoughnutChart";
import { TotalBalanceBoxProps } from "@/types";
import { Card3D } from "@/components/animations/Card3D";
import { FadeIn } from "@/components/animations/FadeIn";
import { AnimatedCounter as EnhancedAnimatedCounter } from "@/components/animations/AnimatedCounter";

const TotalBalanceBox: React.FC<TotalBalanceBoxProps> = ({ accounts, totalBanks, totalCurrentBalance }) => {
	console.log("DEBUG totalCurrentBalance: ", totalCurrentBalance);

	return (
		<FadeIn>
			<Card3D className="total-balance bg-white dark:bg-gray-800 rounded-xl shadow-lg">
				<div className="total-balance-chart">
					<DoughnutChart accounts={accounts} />
				</div>
				<div className="flex flex-col gap-6">
					<header className="header-2">
						<div>Total Banks: {totalBanks}</div>
						<div>Total Accounts: {accounts.length}</div>
					</header>
					<div className="flex flex-col gap-2">
						<p className="total-balance-label">Total Current Balance</p>
						<div className="total-balance-amount flex-center gap-2">
							<EnhancedAnimatedCounter 
								to={totalCurrentBalance} 
								decimals={2} 
								prefix="$" 
								className="text-brand-600 font-bold"
							/>
						</div>
					</div>
				</div>
			</Card3D>
		</FadeIn>
	);
};

export default TotalBalanceBox;
