import { formatAmount } from "@/lib/utils";
import { CreditCardProps } from "@/types";
import { Card3D } from "@/components/animations/Card3D";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

interface EnhancedCreditCardProps extends CreditCardProps {
	isActive?: boolean;
}

const BankCard = ({ account, userName, showBalance = true, isActive = false }: EnhancedCreditCardProps) => {
	return (
		<FadeIn className="flex flex-col">
			<Card3D className={`bank-card relative overflow-hidden transition-all duration-300 ${isActive ? "transform shadow-xl" : ""}`}>
				<div className="bank-card_content">
					<div>
						<h1 className="text-16 font-semibold text-white">{account.name || userName}</h1>
						<p className="font-ibm-plex-serif font-black text-white">{showBalance ? formatAmount(account.currentBalance || 0) : "••••••"}</p>
					</div>
					<article className="flex flex-col gap-2">
						<div className="flex justify-between">
							<h1 className="text-12 font-bold text-white">{userName}</h1>
							<h2 className="text-12 font-bold text-white">●●/●●</h2>
						</div>
						<p className="text-14 font-semibold tracking-[1.1px] text-white">
							●●●● ●●●● ●●●● <span className="text-16">{account.mask || 1234}</span>
						</p>
					</article>
				</div>
				<div className="bank-card_icon">
					<Image src="/icons/Paypass.svg" width={20} height={24} alt="pay" />
					<Image className="ml-5" src="/icons/mastercard.svg" width={45} height={32} alt="mastercard" />
				</div>
				<Image className="absolute top-0 left-0 transition-opacity duration-300" src="/icons/lines.png" width={60} height={190} alt="lines" />

				{/* Add a subtle highlight effect when card is active */}
				{isActive && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-10"></div>}
			</Card3D>

			{/* Card details that only show when active */}
			{isActive && (
				<div className="mt-4 bg-white p-4 rounded-lg shadow-md transform transition-all duration-300 animate-fadeIn">
					<h3 className="font-semibold text-gray-800 mb-2">Card Details</h3>
					<div className="flex justify-between items-center">
						<span className="text-gray-600">Balance</span>
						<span className="font-semibold">{formatAmount(account.currentBalance || 0)}</span>
					</div>
					<div className="flex justify-between items-center mt-2">
						<span className="text-gray-600">Account Number</span>
						<span className="font-semibold">••••{account.mask || 1234}</span>
					</div>
					<Button
						variant="brand-primary"
						className="mt-3 w-full"
						aria-label="Copy card number"
						onClick={(e) => {
							e.preventDefault();
							navigator.clipboard.writeText(`••••${account.mask || 1234}`);
							// You could use toast here if needed
						}}>
						Copy Number
					</Button>
				</div>
			)}
		</FadeIn>
	);
};

export default BankCard;
