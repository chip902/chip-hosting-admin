"use client";
import { Button, Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { addWeeks, eachDayOfInterval, endOfWeek, format, isToday, startOfWeek, subWeeks } from "date-fns";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import LogTime from "./LogTime";
import TimeGrid from "./TimeGrid";
import classNames from "classnames";
import { AlertDialog, Flex } from "@radix-ui/themes";

export default function Timesheet() {
	const [currentWeek, setCurrentWeek] = useState(new Date());
	const [loadingError, setLoadingError] = useState(false);
	const [timeEntries, setTimeEntries] = useState([]);
	const [startDate, setStartDate] = useState<string>();
	const [endDate, setEndDate] = useState<string>();
	const container = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const currentMinute = new Date().getHours() * 60;
		if (container.current) {
			container.current.scrollTop = (container.current.scrollHeight * currentMinute) / 1440;
		}
	}, []);
	useEffect(() => {
		const start = new Date();
		start.setDate(start.getDate() - start.getDay()); // Start of the week (Sunday)
		const end = new Date(start);
		end.setDate(start.getDate() + 6); // End of the week (Saturday)

		setStartDate(start.toISOString().split("T")[0]);
		setEndDate(end.toISOString().split("T")[0]);
	}, [currentWeek]);

	const handlePreviousWeek = () => {
		setCurrentWeek(subWeeks(currentWeek, 1));
	};

	const handleNextWeek = () => {
		setCurrentWeek(addWeeks(currentWeek, 1));
	};

	const handleToday = () => {
		setCurrentWeek(new Date());
	};

	const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Start on Sunday
	const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
	const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

	if (loadingError) {
		return (
			<AlertDialog.Root defaultOpen={true}>
				<AlertDialog.Content maxWidth="450px">
					<AlertDialog.Title>Database Error</AlertDialog.Title>
					<AlertDialog.Description size="2">
						The Database connection cannot be established. Check your connection and try again.
					</AlertDialog.Description>
					<Flex gap="3" mt="4" justify="end">
						<AlertDialog.Cancel>
							<Button color="red" onClick={() => setLoadingError(false)}>
								Dismiss
							</Button>
						</AlertDialog.Cancel>
					</Flex>
				</AlertDialog.Content>
			</AlertDialog.Root>
		);
	}

	return (
		<div className="h-screen flex-col dark:bg-gray-900">
			<header className="flex flex-auto items-center justify-between border-b border-gray-200 px-6 py-4 z-20 dark:border-gray-700">
				<h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
					<time dateTime={format(currentWeek, "yyyy-MM")}>{format(currentWeek, "MMMM yyyy")}</time>
				</h1>

				<div className="flex items-center">
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
						<div className="ml-6 h-6 w-px bg-gray-300 dark:bg-gray-700" />
						<LogTime />
					</div>
					<Menu as="div" className="relative ml-6 md:hidden">
						<MenuButton className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
							<span className="sr-only">Open menu</span>
							<EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
						</MenuButton>
						<Transition
							enter="transition ease-out duration-100"
							enterFrom="transform opacity-0 scale-95"
							enterTo="transform opacity-100 scale-100"
							leave="transition ease-in duration-75"
							leaveFrom="transform opacity-100 scale-100"
							leaveTo="transform opacity-0 scale-95">
							<MenuItems className="absolute right-0 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:divide-gray-700 dark:ring-gray-700">
								<div className="py-1">
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
												Log Time
											</a>
										)}
									</MenuItem>
								</div>
								<div className="py-1">
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
												Go to today
											</a>
										)}
									</MenuItem>
								</div>
								<div className="py-1">
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
			</header>
			<div ref={container} className="flex flex-auto flex-col bg-white dark:bg-gray-900">
				<div style={{ width: "100%" }} className="flex max-w-full flex-none flex-col">
					<div className="sticky top-0 z-10 bg-white shadow ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
						<div className="grid grid-cols-8 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 dark:divide-gray-700 dark:border-gray-700">
							<div className="col-start-1 col-end-2 w-14 hourColumn"></div> {/* Empty space for the time column */}
							{days.map((day, index) => (
								<div key={index} className="flex items-center justify-center py-3 col-span-1">
									<span
										className={classNames(
											isToday(day) ? "bg-indigo-600 text-white p-3 rounded-xl" : "text-gray-900 dark:text-gray-300",
											"flex items-baseline"
										)}>
										{format(day, "EEE")}{" "}
										<span
											className={classNames(
												isToday(day) ? "rounded-xl bg-indigo-600 text-white" : "text-gray-900 dark:text-gray-300",
												"ml-1.5 flex h-8 w-8 items-center justify-center font-semibold"
											)}>
											{format(day, "d")}
										</span>
									</span>
								</div>
							))}
						</div>
					</div>
					<TimeGrid startDate={weekStart.toISOString().split("T")[0]} endDate={weekEnd.toISOString().split("T")[0]} />
				</div>
			</div>
		</div>
	);
}
