// app/transactions/error.tsx
"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-dropdown-menu";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="container mx-auto py-6">
			<Alert variant="destructive">
				<AlertTitle>Something went wrong!</AlertTitle>
				<AlertDescription>
					{error.message}
					<Separator />
					<Button variant="outline" onClick={reset} className="mt-4">
						Try again
					</Button>
				</AlertDescription>
			</Alert>
		</div>
	);
}
