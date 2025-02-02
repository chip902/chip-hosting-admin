"use client";

import { useEffect } from "react";
import MainLayout from "./MainLayout";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<MainLayout>
			<div className="flex min-h-screen flex-col items-center justify-center">
				<h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
				<button className="text-blue-600 hover:text-blue-800 underline" onClick={() => reset()}>
					Try again
				</button>
			</div>
		</MainLayout>
	);
}
