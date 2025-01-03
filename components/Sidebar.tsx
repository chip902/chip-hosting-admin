// Sidebar.tsx

import { Cog6ToothIcon, DocumentDuplicateIcon } from "@heroicons/react/20/solid";
import { Building2, CalendarIcon, Clock, DollarSign, HomeIcon, PieChartIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const navigation = [
	{ name: "Dashboard", href: "/", icon: HomeIcon },
	{ name: "Time Sheets", href: "/timesheet", icon: Clock },
	{ name: "Invoices", href: "/invoices", icon: DollarSign },
	{ name: "Customers", href: "/customers", icon: Building2 },
	{ name: "Calendar", href: "/calendar", icon: CalendarIcon },
	{ name: "Projects", href: "/projects", icon: DocumentDuplicateIcon },
	{ name: "Transaction Reporting", href: "/transactions", icon: PieChartIcon },
];

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

interface Props {
	currentPath?: string;
	className?: string;
}

export default function Sidebar({ currentPath, className }: Props) {
	return (
		<div className={classNames("flex flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4", className || "")}>
			<div className="flex h-16 shrink-0 items-center mt-2">
				<div className="h-12 w-auto rounded-full">
					<Image width="50" height="50" src="/CHS_Logo.png" alt="Chip Hosting Solutions Logo" />
				</div>
			</div>
			<nav className="flex flex-1 flex-col">
				<ul role="list" className="flex flex-1 flex-col gap-y-7">
					<li>
						<ul role="list" className="-mx-2 space-y-1">
							{navigation.map((item) => (
								<li key={item.name}>
									<Link legacyBehavior href={item.href}>
										<a
											className={classNames(
												item.href === currentPath ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white",
												"group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
											)}>
											<item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
											{item.name}
										</a>
									</Link>
								</li>
							))}
						</ul>
					</li>
					<li className="mt-auto">
						<a
							href="#"
							className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white">
							<Cog6ToothIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
							Settings
						</a>
					</li>
				</ul>
			</nav>
		</div>
	);
}
