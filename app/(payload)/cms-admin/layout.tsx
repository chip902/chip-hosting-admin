"use client";

import "./admin.css";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, FileText, FolderOpen, Image as ImageIcon, Users, Settings, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Args = {
	children: React.ReactNode;
};

const cmsNavigation = [
	{ name: "Dashboard", href: "/cms-admin", icon: Home },
	{ name: "Posts", href: "/cms-admin/posts", icon: FileText },
	{ name: "Categories", href: "/cms-admin/categories", icon: FolderOpen },
	{ name: "Media", href: "/cms-admin/media", icon: ImageIcon },
	{ name: "Users", href: "/cms-admin/users", icon: Users },
];

function CMSSidebar() {
	const pathname = usePathname();

	return (
		<div className="flex h-full w-64 flex-col bg-background border-r border-border">
			{/* Logo */}
			<div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded-full">
						<Image width="32" height="32" src="/CHS_logo_v2.webp" alt="Chip Hosting Solutions Logo" />
					</div>
					<div>
						<h2 className="text-lg font-semibold">CMS</h2>
						<p className="text-xs text-muted-foreground">Content Studio</p>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex flex-1 flex-col px-4 py-6">
				<ul role="list" className="flex flex-1 flex-col gap-y-1">
					{cmsNavigation.map((item) => {
						const isActive = pathname === item.href || (item.href !== "/cms-admin" && pathname?.startsWith(item.href));
						return (
							<li key={item.name}>
								<Link
									href={item.href}
									className={cn(
										"group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
										isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
									)}>
									<item.icon
										className={cn(
											"h-5 w-5 shrink-0 transition-colors",
											isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
										)}
									/>
									{item.name}
								</Link>
							</li>
						);
					})}
				</ul>

				{/* Back to Main App */}
				<div className="mt-auto space-y-2">
					<div className="h-px bg-border" />
					<Link
						href="/"
						className="group flex gap-x-3 rounded-lg p-3 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
						<ArrowLeft className="h-5 w-5 shrink-0" />
						Back to App
					</Link>
					<Link
						href="#"
						className="group flex gap-x-3 rounded-lg p-3 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
						<Settings className="h-5 w-5 shrink-0" />
						Settings
					</Link>
				</div>
			</nav>
		</div>
	);
}

const CustomAdminLayout = ({ children }: Args) => (
	<div className="flex h-screen w-full bg-background">
		<CMSSidebar />
		<div className="flex-1 flex flex-col overflow-hidden">
			<main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
		</div>
	</div>
);

export default CustomAdminLayout;
