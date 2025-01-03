// PlaidLink.tsx
"use client";
import { PlaidLinkProps } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { PlaidLinkOnSuccessMetadata, PlaidLinkOptions, usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Spinner } from "@radix-ui/themes";
import Image from "next/image";

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const getLinkToken = async () => {
			try {
				const res = await fetch("/api/plaid/create-link-token", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ user }),
				});

				if (!res.ok) {
					throw new Error("Error fetching link token");
				}

				const data = await res.json();
				setToken(data.linkToken);
			} catch (error) {
				console.error("Error getting link token:", error);
			}
		};
		getLinkToken();
	}, [user]);

	const onSuccess = useCallback(
		async (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => {
			setIsLoading(true);
			try {
				if (!user) {
					throw new Error("User is undefined");
				}

				// Step 1: Exchange public token with Plaid
				const exchangeRes = await axios.post(
					"/api/plaid/exchange-public-token",
					{ publicToken: public_token, userID: user },
					{ headers: { "Content-Type": "application/json" } }
				);

				const { accessToken, itemId, bankId } = exchangeRes.data;

				// Step 2: Get account ID from metadata
				const accountId = metadata.accounts[0]?.id;
				if (!accountId) throw new Error("No account ID found");

				// Step 3: Create processor token for Dwolla
				const processorRes = await axios.post(
					"/api/plaid/create-processor-token",
					{ accessToken, accountId },
					{ headers: { "Content-Type": "application/json" } }
				);

				const { processorToken } = processorRes.data;

				// Step 4: Create or get Dwolla customer
				let dwollaCustomerId = user.dwollaCustomerId;
				if (!dwollaCustomerId) {
					const createCustomerRes = await axios.post("/api/dwolla/create-customer", { user }, { headers: { "Content-Type": "application/json" } });
					const { customerId } = createCustomerRes.data;
					dwollaCustomerId = customerId;
				}

				// Step 5: Create funding source in Dwolla
				const fundingSourceRes = await axios.post(
					"/api/dwolla/create-funding-source",
					{
						customerId: dwollaCustomerId,
						customerUrl: user.dwollaCustomerUrl,
						processorToken,
						accountId: accountId,
						bankName: metadata?.institution?.name,
						bankAccountType: "business",
					},
					{ headers: { "Content-Type": "application/json" } }
				);

				const { fundingSourceUrl } = fundingSourceRes.data;

				// Step 6: Update bank record with funding source URL
				await axios.post(
					"/api/plaid/update-bank",
					{
						bankId,
						accountId,
						fundingSourceUrl,
					},
					{ headers: { "Content-Type": "application/json" } }
				);

				router.push("/");
			} catch (error) {
				console.error("Error in onSuccess:", error);
				// You might want to show an error message to the user here
			} finally {
				setIsLoading(false);
			}
		},
		[user, router]
	);

	const config: PlaidLinkOptions = {
		token,
		onSuccess,
	};

	const { open, ready, error } = usePlaidLink(config);

	if (!token || !ready) {
		return <Spinner />;
	}

	return (
		<>
			{isLoading ? (
				<Spinner />
			) : variant === "primary" ? (
				<Button onClick={() => open()} className="plaidlink-primary">
					Connect Bank
				</Button>
			) : variant === "ghost" ? (
				<Button onClick={() => open()} className="plaidlink-ghost">
					<Image src="/icons/connect-bank.svg" alt="connect bank" height={24} width={24} />
					<p className="hidden text-[16px] font-semibold text-black-2 xl:block">Connect Bank</p>
				</Button>
			) : (
				<Button onClick={() => open()} className="plaidlink-default">
					<Image src="/icons/connect-bank.svg" alt="connect bank" height={24} width={24} />
					<p className="text-[16px] font-semibold text-black-2">Connect Bank</p>
				</Button>
			)}
		</>
	);
};

export default PlaidLink;
