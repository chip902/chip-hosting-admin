import "./globals.css";
import { Providers } from "./providers";
import MainLayout from "./MainLayout";
import { Metadata } from "next";
import "@radix-ui/themes/styles.css";

export const metadata: Metadata = {
	title: "Chip Hosting Admin",
	description: "Admin dashboard for Chip Hosting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full antialiased [--removed-body-scroll-bar-size:0px]">
			<body className="h-full">
				<Providers>
					<MainLayout>{children}</MainLayout>
				</Providers>
			</body>
		</html>
	);
}
