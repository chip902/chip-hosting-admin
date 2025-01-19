"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html>
			<body>
				<div className="flex min-h-screen flex-col items-center justify-center">
					<h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
					<button onClick={() => reset()} className="text-blue-600 hover:text-blue-800 underline">
						Try again
					</button>
				</div>
			</body>
		</html>
	);
}
