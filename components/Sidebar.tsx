// Sidebar.tsx

import { Building2, CalendarIcon, Clock, DollarSign, FileText, Home, PieChart, Settings, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FloatingElement } from "@/components/animations/FloatingElement";

const navigation = [
	{ name: "Dashboard", href: "/", icon: Home },
	{ name: "Time Sheets", href: "/timesheet", icon: Clock },
	{ name: "Invoices", href: "/invoices", icon: DollarSign },
	{ name: "Customers", href: "/customers", icon: Building2 },
	{ name: "Calendar", href: "/calendar", icon: CalendarIcon },
	{ name: "Projects", href: "/projects", icon: FileText },
	{ name: "Transaction Reporting", href: "/transactions", icon: PieChart },
	{ name: "CMS Admin", href: "/cms-admin", icon: BookOpen },
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
		<div className={classNames("sidebar", className || "")}>
			<div className="flex h-16 shrink-0 items-center mt-2">
				<FloatingElement className="h-16 w-auto rounded-full" yOffset={8} duration={6}>
					<div className="rounded-full shadow-2xl p-0.5 bg-white/95 dark:bg-white/90 dark:shadow-md">
						<Image
							width="60"
							height="60"
							src="/CHS_logo_v2.webp"
							alt="Chip Hosting Solutions Logo"
							className="rounded-full dark:brightness-110 dark:contrast-110"
						/>
					</div>
				</FloatingElement>
			</div>
			<nav className="flex flex-1 flex-col mt-6">
				<ul role="list" className="flex flex-1 flex-col gap-y-7">
					<li>
						<ul role="list" className="-mx-2 space-y-1">
							{navigation.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className={classNames(
											item.href === currentPath
												? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg transform scale-105"
												: "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200",
											"group flex gap-x-3 rounded-lg p-3 text-14 font-semibold leading-6 transition-all duration-200 hover:transform hover:scale-105 hover:shadow-md"
										)}>
										<item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
										<span className="transition-all duration-200">{item.name}</span>
									</Link>
								</li>
							))}
						</ul>
					</li>
					<li className="mt-auto">
						<a href="#" className="sidebar-link group -mx-2 flex gap-x-3 rounded-md p-2 text-14 font-semibold leading-6">
							<Settings className="h-6 w-6 shrink-0" aria-hidden="true" />
							Settings
						</a>
					</li>
				</ul>
			</nav>
		</div>
	);
}
