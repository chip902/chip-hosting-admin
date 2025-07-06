// app/transactions/loading.tsx

import React from "react";

export default function LoadingTransactions() {
	return (
		<div className="container mx-auto py-6">
			<div className="animate-pulse">
				<div className="h-8 w-48 bg-gray-200 rounded mb-6" />
				<div className="space-y-4">
					{/* Controls skeleton */}
					<div className="flex gap-4 items-center">
						<div className="w-[200px] h-10 bg-gray-200 rounded" />
						<div className="w-[300px] h-10 bg-gray-200 rounded" />
						<div className="w-24 h-10 bg-gray-200 rounded" />
					</div>

					{/* Summary cards skeleton */}
					<div className="grid grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="p-6 bg-gray-200 rounded-lg">
								<div className="h-4 w-24 bg-gray-300 rounded mb-2" />
								<div className="h-6 w-32 bg-gray-300 rounded" />
							</div>
						))}
					</div>

					{/* Chart skeleton */}
					<div className="h-[400px] bg-gray-200 rounded-lg" />

					{/* Table skeleton */}
					<div className="space-y-2">
						<div className="h-10 bg-gray-200 rounded" />
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} className="h-16 bg-gray-200 rounded" />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
