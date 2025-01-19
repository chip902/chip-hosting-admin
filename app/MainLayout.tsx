"use client";

import DarkModeSwitch from "@/components/DarkModeSwitch";
import Sidebar from "@/components/Sidebar";
import { Dialog, DialogPanel, Menu, MenuButton, MenuItem, MenuItems, Transition, TransitionChild } from "@headlessui/react";
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { ChevronDownIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useState } from "react";

const poppins = Poppins({
	subsets: ["latin"],
	variable: "--font-poppins",
	weight: "100",
});

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

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
		<div className={classNames(poppins.variable, "h-full flex dark:bg-gray-900")}>
			<Transition show={sidebarOpen} as={Fragment}>
				<Dialog className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
					<TransitionChild
						enter="transition-opacity ease-linear duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="transition-opacity ease-linear duration-300"
						leaveFrom="opacity-100"
						leaveTo="opacity-0">
						<div className="fixed inset-0 bg-gray-900/80" />
					</TransitionChild>

					<div className="fixed inset-0 flex">
						<TransitionChild
							enter="transition ease-in-out duration-300 transform"
							enterFrom="-translate-x-full"
							enterTo="translate-x-0"
							leave="transition ease-in-out duration-300 transform"
							leaveFrom="translate-x-0"
							leaveTo="-translate-x-full">
							<DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
								<TransitionChild
									enter="ease-in-out duration-300"
									enterFrom="opacity-0"
									enterTo="opacity-100"
									leave="ease-in-out duration-300"
									leaveFrom="opacity-100"
									leaveTo="opacity-0">
									<div className="absolute left-full top-0 flex w-16 justify-center pt-5">
										<button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
											<span className="sr-only">Close sidebar</span>
											<XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
										</button>
									</div>
								</TransitionChild>
								<Sidebar currentPath={pathname!} />
							</DialogPanel>
						</TransitionChild>
					</div>
				</Dialog>
			</Transition>

			{/* Static sidebar for desktop */}
			<Sidebar currentPath={pathname!} className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-72" />

			{/* Main content */}
			<div className="flex min-w-0 flex-1 flex-col lg:pl-72">
				<div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:bg-gray-800 dark:border-gray-700">
					<button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-300" onClick={() => setSidebarOpen(true)}>
						<span className="sr-only">Open sidebar</span>
						<Bars3Icon className="h-6 w-6" aria-hidden="true" />
					</button>

					<div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
						<form className="relative flex flex-1" action="#" method="GET">
							<label htmlFor="search-field" className="sr-only">
								Search
							</label>
							<MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" aria-hidden="true" />
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
							<Menu as="div" className="relative">
								<MenuButton className="-m-1.5 flex items-center p-1.5">
									<span className="sr-only">Open user menu</span>
									<div className="h-8 w-8 rounded-md bg-gray-50">
										<Image alt="headshot" src="/headshot.jpeg" width={50} height={50} />
									</div>
									<span className="hidden lg:flex lg:items-center">
										<span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">Andrew Chepurny</span>
										<ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
									</span>
								</MenuButton>
								<Transition
									as={Fragment}
									enter="transition ease-out duration-100"
									enterFrom="transform opacity-0 scale-95"
									enterTo="transform opacity-100 scale-100"
									leave="transition ease-in duration-75"
									leaveFrom="transform opacity-100 scale-100"
									leaveTo="transform opacity-0 scale-95">
									<MenuItems className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none dark:bg-gray-800">
										{userNavigation.map((item) => (
											<MenuItem key={item.name}>
												{({ active }) => (
													<a
														href={item.href}
														onClick={item.onClick}
														className={classNames(
															active ? "bg-gray-50 dark:bg-gray-700" : "",
															"block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100"
														)}>
														{item.name}
													</a>
												)}
											</MenuItem>
										))}
									</MenuItems>
								</Transition>
							</Menu>
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
