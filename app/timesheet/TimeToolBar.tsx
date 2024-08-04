"use client";
import { subWeeks, addWeeks, format, startOfWeek, endOfWeek } from "date-fns";
import React, { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { MenuButton, Transition, MenuItems, MenuItem, Menu } from "@headlessui/react";
import classNames from "classnames";
import LogTime from "./LogTime";

interface ITimeToolBar {
	filters: {
		startDate?: Date;
		endDate?: Date;
		customerId?: number;
	};
	setFilters: React.Dispatch<
		React.SetStateAction<{
			startDate?: Date;
			endDate?: Date;
			customerId?: number;
		}>
	>;
}

const TimeToolBar = ({ filters, setFilters }: ITimeToolBar) => {
	const [currentWeek, setCurrentWeek] = useState(new Date());

	useEffect(() => {
		const start = startOfWeek(currentWeek, { weekStartsOn: 0 });
		const end = endOfWeek(currentWeek, { weekStartsOn: 0 });

		setFilters({
			startDate: start,
			endDate: end,
			customerId: filters.customerId,
		});
	}, [currentWeek, setFilters, filters.customerId]);

	const handlePreviousWeek = () => {
		setCurrentWeek(subWeeks(currentWeek, 1));
	};

	const handleNextWeek = () => {
		setCurrentWeek(addWeeks(currentWeek, 1));
	};

	const handleToday = () => {
		setCurrentWeek(new Date());
	};

	return (
		<header className="flex flex-col items-center border-b border-gray-200 px-6 py-4 z-20 dark:border-gray-700">
			<div className="flex w-full items-center justify-end">
				<div className="ml-6 h-6 w-px bg-gray-300 dark:bg-gray-700" />
				<LogTime />

				<div className="flex items-center ml-5">
					<div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch dark:bg-gray-800">
						<button
							type="button"
							onClick={handlePreviousWeek}
							className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-400">
							<span className="sr-only">Previous week</span>
							<ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
						</button>
						<button
							type="button"
							onClick={handleToday}
							className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
							Today
						</button>
						<span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden dark:bg-gray-700" />
						<button
							type="button"
							onClick={handleNextWeek}
							className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-400">
							<span className="sr-only">Next week</span>
							<ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
						</button>
					</div>

					<div className="hidden md:ml-4 md:flex md:items-center">
						<Menu as="div" className="relative">
							<MenuButton
								type="button"
								className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700">
								Week view
								<ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
							</MenuButton>
							<Transition
								enter="transition ease-out duration-100"
								enterFrom="transform opacity-0 scale-95"
								enterTo="transform opacity-100 scale-100"
								leave="transition ease-in duration-75"
								leaveFrom="transform opacity-100 scale-100"
								leaveTo="transform opacity-0 scale-95">
								<MenuItems className="absolute right-0 z-30 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
									<div className="py-1 z-30">
										<MenuItem>
											{({ focus }) => (
												<a
													href="#"
													className={classNames(
														focus
															? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300"
															: "text-gray-700 dark:text-gray-400",
														"block px-4 py-2 text-sm"
													)}>
													Day view
												</a>
											)}
										</MenuItem>
										<MenuItem>
											{({ focus }) => (
												<a
													href="#"
													className={classNames(
														focus
															? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300"
															: "text-gray-700 dark:text-gray-400",
														"block px-4 py-2 text-sm"
													)}>
													Week view
												</a>
											)}
										</MenuItem>
										<MenuItem>
											{({ focus }) => (
												<a
													href="#"
													className={classNames(
														focus
															? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300"
															: "text-gray-700 dark:text-gray-400",
														"block px-4 py-2 text-sm"
													)}>
													Month view
												</a>
											)}
										</MenuItem>
										<MenuItem>
											{({ focus }) => (
												<a
													href="#"
													className={classNames(
														focus
															? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300"
															: "text-gray-700 dark:text-gray-400",
														"block px-4 py-2 text-sm"
													)}>
													Year view
												</a>
											)}
										</MenuItem>
									</div>
								</MenuItems>
							</Transition>
						</Menu>
					</div>
				</div>
			</div>
		</header>
	);
};

export default TimeToolBar;
