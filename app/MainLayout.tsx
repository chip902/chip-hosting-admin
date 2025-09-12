"use client";

import DarkModeSwitch from "@/components/DarkModeSwitch";
import Sidebar from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Search, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useJarvisFloating } from "@/hooks/use-jarvis-floating";
import { useJarvis } from "@/app/hooks/useJarvis";
import { Badge } from "@/components/ui/badge";

// const poppins = Poppins({
// 	subsets: ["latin"],
// 	variable: "--font-poppins",
// 	weight: "100",
// });

// function classNames(...classes: string[]) {
// 	return classes.filter(Boolean).join(" ");
// }

export default function MainLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { openChat } = useJarvisFloating();
	const { isConnected } = useJarvis();
	const userNavigation = [
		{ name: "Your profile", href: "/admin/profile" },
		{
			name: "Sign out",
			onClick: async () => {
				await signOut();
				router.push("/");
			},
		},
		{ name: "Sign In", href: "/sign-in" },
	];
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = usePathname();

	return (
		<div className="h-full flex bg-background" data-main-layout>
			{/* Mobile sidebar using shadcn/ui Sheet */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent side="left" className="p-0 w-full max-w-xs">
					<div className="absolute right-4 top-4 lg:hidden">
						<button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
							<span className="sr-only">Close sidebar</span>
							<X className="h-6 w-6" aria-hidden="true" />
						</button>
					</div>
					<Sidebar currentPath={pathname!} />
				</SheetContent>
			</Sheet>

			{/* Static sidebar for desktop */}
			<Sidebar currentPath={pathname!} className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-72" />

			{/* Main content */}
			<div className="flex min-w-0 flex-1 flex-col lg:pl-72">
				<div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
					<button type="button" className="-m-2.5 p-2.5 text-foreground lg:hidden" onClick={() => setSidebarOpen(true)}>
						<span className="sr-only">Open sidebar</span>
						<Menu className="h-6 w-6" aria-hidden="true" />
					</button>

					<div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
						{/* JARVIS Search Launcher */}
						<button
							onClick={openChat}
							className="relative flex flex-1 items-center gap-3 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-accent transition-colors group">
							<div className="flex items-center gap-2">
								<div className="p-1 rounded bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs">🤖</div>
								<Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
							</div>

							<div className="flex-1 text-left">
								<span className="text-muted-foreground group-hover:text-foreground text-sm">
									Ask JARVIS anything...
								</span>
							</div>

							<div className="flex items-center gap-2">
								{/* Connection Status Indicator */}
								<div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />

								{/* Keyboard Shortcut */}
								<div className="hidden sm:flex items-center gap-1">
									<kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded shadow-sm">
										⌘K
									</kbd>
								</div>
							</div>
						</button>
						<div className="flex items-center gap-x-4 lg:gap-x-6">
							<DarkModeSwitch />
							<DropdownMenu>
								<DropdownMenuTrigger className="-m-1.5 flex items-center p-1.5">
									<span className="sr-only">Open user menu</span>
									<div className="h-8 w-8 rounded-md bg-muted">
										<Image alt="headshot" src="/headshot.jpeg" width={50} height={50} />
									</div>
									<span className="hidden lg:flex lg:items-center">
										<span className="ml-4 text-sm font-semibold leading-6 text-foreground">Andrew Chepurny</span>
										<ChevronDownIcon className="ml-2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
									</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-32">
									{userNavigation.map((item) => (
										<DropdownMenuItem key={item.name} asChild>
											<a href={item.href} onClick={item.onClick} className="cursor-pointer">
												{item.name}
											</a>
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>

				<main className="flex-1">
					<div className="py-6">
						<div className="mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
					</div>
				</main>
			</div>
		</div>
	);
}
