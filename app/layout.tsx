// app/layout.tsx

import "./globals.css";
//import "@radix-ui/themes/styles.css";

import { Providers } from "./providers";
import MainLayout from "./MainLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Chip Hosting Admin",
	description: "Admin dashboard for Chip Hosting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning className="h-full antialiased [--removed-body-scroll-bar-size:0px]">
			<head></head>
			<body className="h-full">
				<Providers>
					<MainLayout>{children}</MainLayout>
				</Providers>
			</body>
		</html>
	);
}
