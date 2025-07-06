import type { Metadata } from "next";
import AdminDashboard from "./AdminDashboard";

type Props = {
	params: Promise<{
		segments?: string[];
	}>;
	searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const metadata: Metadata = {
	title: "Admin Dashboard | Chip Hosting CMS",
	description: "Custom admin dashboard for Chip Hosting",
};

export default async function AdminPage({ params, searchParams }: Props) {
	const resolvedParams = await params;
	const resolvedSearchParams = await searchParams;

	return <AdminDashboard segments={resolvedParams.segments} searchParams={resolvedSearchParams} />;
}
