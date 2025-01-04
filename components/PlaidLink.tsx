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

				// Exchange public token with Plaid
				await axios.post(
					"/api/plaid/exchange-public-token",
					{
						publicToken: public_token,
						userID: user,
						accountId: metadata.accounts[0]?.id,
						institutionName: metadata.institution?.name || "Unknown Bank",
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
