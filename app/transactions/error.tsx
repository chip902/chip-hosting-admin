// app/transactions/error.tsx
"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import TransactionImporter from "@/components/TransactionImporter";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
	userId: string;
}

export default function Error({ error, reset, userId }: ErrorProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="container mx-auto py-6">
			<Alert variant="destructive" className="mb-6">
				<AlertTitle>Something went wrong!</AlertTitle>
				<AlertDescription className="mt-2">
					<p>{error.message}</p>
					<div className="mt-4">
						<Button variant="outline" onClick={reset}>
							Try again
						</Button>
					</div>
				</AlertDescription>
			</Alert>

			<div className="mt-8">
				<h2 className="text-lg font-semibold mb-4">Manual Import Option</h2>
				<p className="text-sm text-gray-600 mb-4">While we fix the issue, you can manually import your transactions:</p>
				<TransactionImporter userId={userId} />
			</div>
		</div>
	);
}
