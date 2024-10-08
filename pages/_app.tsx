import "@/app/globals.css";
import "@radix-ui/themes/styles.css";
import RootLayout from "@/app/layout";
import { AppProps } from "next/app";

export default function MyApp({ Component, pageProps }: AppProps) {
	return (
		<RootLayout>
			<Component {...pageProps} />
		</RootLayout>
	);
}
