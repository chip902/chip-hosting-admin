// app/layout.tsx

import "./globals.css";
import { Providers } from "./providers";
import { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "Chip Hosting Admin",
	description: "Admin dashboard for Chip Hosting",
};

// Minimal root layout - just html/body/providers
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning className="h-full antialiased [--removed-body-scroll-bar-size:0px]">
			<head></head>
			<body className="h-full">
				<Providers>
					{children}
					<Toaster richColors position="top-right" />
				</Providers>
			</body>
		</html>
	);
}
