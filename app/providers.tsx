"use client";

import { ThemeProvider } from "next-themes";
import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

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
				<Theme accentColor="blue" grayColor="slate" scaling="100%" style={{ width: "100%", height: "100%" }}>
					<div className="h-full [--scale-x:1] [--scale-y:1]">{children}</div>
				</Theme>
			</QueryClientProvider>
		</ThemeProvider>
	);
}
