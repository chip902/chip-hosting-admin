// app/layout.tsx
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
			<head>
				{/* Load Radix UI styles from CDN */}
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@radix-ui/themes@latest/styles.css" />
				{/* Load Tailwind from CDN */}
				<script src="https://cdn.tailwindcss.com"></script>
				<script
					dangerouslySetInnerHTML={{
						__html: `
              tailwind.config = {
                darkMode: "class",
                theme: {
                  extend: {
                    // Your theme extensions here (simplified for brevity)
                  }
                }
              }
            `,
					}}
				/>
			</head>
			<body className="h-full">
				<Providers>
					<MainLayout>{children}</MainLayout>
				</Providers>
			</body>
		</html>
	);
}
