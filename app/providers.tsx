"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import { JarvisFloatingProvider } from "@/hooks/use-jarvis-floating";

export function Providers({ children }: PropsWithChildren) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 1000,
						refetchOnWindowFocus: false,
					},
				},
			})
	);

	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<QueryClientProvider client={queryClient}>
				<JarvisFloatingProvider>
					<div className="h-full [--scale-x:1] [--scale-y:1]">{children}</div>
				</JarvisFloatingProvider>
			</QueryClientProvider>
		</ThemeProvider>
	);
}
