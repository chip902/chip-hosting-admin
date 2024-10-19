// PlaidLink.tsx
"use client";
import { PlaidLinkProps } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { PlaidLinkOnSuccessMetadata, PlaidLinkOptions, usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Spinner } from "@radix-ui/themes";

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
	const [token, setToken] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		console.log("User object being sent to create-link-token API:", user);

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
				console.log("Link Token data:", data);
				setToken(data.linkToken);
			} catch (error) {
				console.error("Error getting link token:", error);
				// Handle the error, e.g., set an error state or show a notification
			}
		};
		getLinkToken();
	}, [user]);

	const onSuccess = useCallback(
		async (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => {
			try {
				if (!user) {
					throw new Error("User is undefined");
				}
				console.log("onSuccess - public_token:", public_token);
				console.log("onSuccess - user:", user);

				// Step 1: Exchange public token with Plaid
				const exchangeRes = await axios.post(
					"/api/plaid/exchange-public-token",
					{ publicToken: public_token, userID: user },
					{ headers: { "Content-Type": "application/json" } }
				);
				if (!exchangeRes) throw new Error("Failed to exchange public token");
				const { accessToken, itemId } = exchangeRes.data;

				// Step 2: Get account ID from metadata
				const accountId = metadata.accounts[0]?.id;
				if (!accountId) throw new Error("No account ID found");

				// Step 3: Create processor token for Dwolla
				const processorRes = await axios.post(
					"/api/plaid/create-processor-token",
					{ accessToken, accountId },
					{ headers: { "Content-Type": "application/json" } }
				);
				if (!processorRes) throw new Error("Failed to create processor token");
				const { processorToken } = processorRes.data;

				// Step 4: Create Dwolla customer if necessary
				let dwollaCustomerId = user.dwollaCustomerId;
				if (!dwollaCustomerId) {
					const createCustomerRes = await axios.post("/api/dwolla/create-customer", { user }, { headers: { "Content-Type": "application/json" } });
					if (!createCustomerRes) throw new Error("Failed to create Dwolla customer");
					const { customerId } = createCustomerRes.data;
					dwollaCustomerId = customerId;
				}

				// Step 5: Create funding source in Dwolla
				let fundingSourceRes = await axios.post(
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
				if (!fundingSourceRes) {
					throw new Error("Failed to create funding source");
				} else if (!("data" in fundingSourceRes)) {
					throw new Error("Invalid data from 'addFundingSource': missing 'data'. ");
				}
				const fundingSourceUrl = fundingSourceRes.data.fundingSourceUrl; // now TypeScript knows that 'fundingSourceRes' has a 'data' property of type 'any' (or the known type if provided in function definition)

				// Step 6: Optionally save funding source URL to your database

				console.log("Dwolla funding source created:", fundingSourceUrl);
				router.push("/");
			} catch (error) {
				console.error("Error in onSuccess:", error);
				// Display an error message to the user if necessary
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
		<Button onClick={() => open()} className="plaidlink-primary">
			Connect Bank
		</Button>
	);
};

export default PlaidLink;
