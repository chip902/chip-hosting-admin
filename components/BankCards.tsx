"use client";
import React, { useState, useRef, useEffect } from "react";
import PlaidLink from "./PlaidLink";
import BankCard from "./BankCard";
import { User } from "@/types";
import { useToast } from "@/app/hooks/useToast";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BankCardsProps {
	user: User;
}

const BankCards: React.FC<BankCardsProps> = ({ user }) => {
	const [activeCardIndex, setActiveCardIndex] = useState(0);
	const carouselRef = useRef<HTMLDivElement>(null);
	const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

	const { data: plaidData, isLoading: isPlaidLoading, error: plaidError } = usePlaidBanks(user.userId);
	const { transactions, isLoading: isTransactionsLoading, error: transactionsError } = usePlaidTransactions(user.userId || "");
	const { toast } = useToast();

	const accounts = plaidData?.accounts || [];
	const totalBanks = plaidData?.totalBanks || 0;

	// Function to smoothly scroll to the active card
	const scrollToActiveCard = () => {
		if (cardRefs.current[activeCardIndex] && carouselRef.current) {
			const card = cardRefs.current[activeCardIndex];
			const container = carouselRef.current;

			if (card) {
				container.scrollTo({
					left: card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2,
					behavior: "smooth",
				});
			}
		}
	};

	// Effect to scroll when activeCardIndex changes
	useEffect(() => {
		scrollToActiveCard();
	}, [activeCardIndex]);

	// Setup keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") {
				setActiveCardIndex((prev) => (prev - 1 + accounts.length) % accounts.length);
			} else if (e.key === "ArrowRight") {
				setActiveCardIndex((prev) => (prev + 1) % accounts.length);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [accounts.length]);

	// Handle navigation
	const goToPrevious = () => {
		setActiveCardIndex((prev) => (prev - 1 + accounts.length) % accounts.length);
	};

	const goToNext = () => {
		setActiveCardIndex((prev) => (prev + 1) % accounts.length);
	};

	if (!accounts || accounts.length === 0) return null;

	return (
		<section className="banks relative">
			<div className="flex w-full justify-between items-center mb-6">
				<h2 className="header-2">My Banks</h2>
				<PlaidLink user={user} variant="primary" />
			</div>

			{/* Carousel Navigation Buttons */}
			{accounts.length > 1 && (
				<>
					<button
						onClick={goToPrevious}
						className="absolute left-0 top-1/2 z-20 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transform -translate-y-1/2"
						aria-label="Previous bank card">
						<ChevronLeft size={24} />
					</button>

					<button
						onClick={goToNext}
						className="absolute right-0 top-1/2 z-20 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transform -translate-y-1/2"
						aria-label="Next bank card">
						<ChevronRight size={24} />
					</button>
				</>
			)}

			{/* Carousel Container */}
			<div ref={carouselRef} className="overflow-x-auto pb-4 hide-scrollbar" role="region" aria-label="Bank cards carousel">
				<div className="flex flex-row transition-all duration-300 gap-4 px-8">
					{accounts.map((account, index) => (
						<div
							key={account.id}
							ref={(el) => {
								cardRefs.current[index] = el;
							}}
							onClick={() => setActiveCardIndex(index)}
							className={`relative z-10 flex-none w-full max-w-md cursor-pointer transition-all duration-300 ${
								activeCardIndex === index ? "opacity-100 scale-105 shadow-lg" : "opacity-50 scale-95"
							} hover:opacity-80`}
							role="button"
							tabIndex={0}
							aria-label={`${account.name} bank card, ${index + 1} of ${accounts.length}`}
							aria-selected={activeCardIndex === index}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									setActiveCardIndex(index);
								}
							}}>
							<BankCard
								account={account}
								userName={`${user.firstName || ""} ${user.lastName || ""}`}
								showBalance={activeCardIndex === index}
								isActive={activeCardIndex === index}
							/>
						</div>
					))}
				</div>
			</div>

			{/* Progress Indicators */}
			{accounts.length > 1 && (
				<div className="flex justify-center gap-2 mt-4">
					{accounts.map((_, index) => (
						<button
							key={index}
							onClick={() => setActiveCardIndex(index)}
							className={`w-3 h-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								activeCardIndex === index ? "bg-blue-500" : "bg-gray-300"
							}`}
							aria-label={`Go to card ${index + 1}`}
							aria-current={activeCardIndex === index ? "true" : "false"}
						/>
					))}
				</div>
			)}
		</section>
	);
};

export default BankCards;
