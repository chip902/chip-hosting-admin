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
		<div className="h-full flex dark:bg-gray-900" data-main-layout>
			{/* Mobile sidebar using shadcn/ui Sheet */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent side="left" className="p-0 w-full max-w-xs">
					<div className="absolute right-4 top-4 lg:hidden">
						<button
							type="button"
							className="-m-2.5 p-2.5"
							onClick={() => setSidebarOpen(false)}
						>
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
				<div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:bg-gray-800 dark:border-gray-700">
					<button
						type="button"
						className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-300"
						onClick={() => setSidebarOpen(true)}
					>
						<span className="sr-only">Open sidebar</span>
						<Menu className="h-6 w-6" aria-hidden="true" />
					</button>

					<div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
						<form className="relative flex flex-1" action="#" method="GET">
							<label htmlFor="search-field" className="sr-only">
								Search
							</label>
							<Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" aria-hidden="true" />
							<input
								id="search-field"
								className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm dark:text-gray-100"
								placeholder="Search..."
								type="search"
								name="search"
							/>
						</form>
						<div className="flex items-center gap-x-4 lg:gap-x-6">
							<DarkModeSwitch />
							<DropdownMenu>
								<DropdownMenuTrigger className="-m-1.5 flex items-center p-1.5">
									<span className="sr-only">Open user menu</span>
									<div className="h-8 w-8 rounded-md bg-gray-50">
										<Image alt="headshot" src="/headshot.jpeg" width={50} height={50} />
									</div>
									<span className="hidden lg:flex lg:items-center">
										<span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">Andrew Chepurny</span>
										<ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
									</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-32">
									{userNavigation.map((item) => (
										<DropdownMenuItem key={item.name} asChild>
											<a
												href={item.href}
												onClick={item.onClick}
												className="cursor-pointer"
											>
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
