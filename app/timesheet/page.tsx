"use client";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { useState, useEffect, useRef } from "react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

export default function Timesheet() {
	const [currentWeek, setCurrentWeek] = useState(new Date());
	const container = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const currentMinute = new Date().getHours() * 60;
		if (container.current) {
			container.current.scrollTop = (container.current.scrollHeight * currentMinute) / 1440;
		}
	}, []);

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

	return (
		<div className="main-content h-screen flex-col overflow-hidden">
			<header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4 z-20">
				<h1 className="text-base font-semibold leading-6 text-gray-900">
					<time dateTime={format(currentWeek, "yyyy-MM")}>{format(currentWeek, "MMMM yyyy")}</time>
				</h1>

				<div className="flex items-center">
					<div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
						<button
							type="button"
							onClick={handlePreviousWeek}
							className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50">
							<span className="sr-only">Previous week</span>
							<ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
						</button>
						<button
							type="button"
							onClick={handleToday}
							className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block">
							Today
						</button>
						<span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
						<button
							type="button"
							onClick={handleNextWeek}
							className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50">
							<span className="sr-only">Next week</span>
							<ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
						</button>
					</div>
					<div className="hidden md:ml-4 md:flex md:items-center">
						<Menu as="div" className="relative">
							<MenuButton
								type="button"
								className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
								Week view
								<ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
							</MenuButton>

							<Transition
								enter="transition ease-out duration-100"
								enterFrom="transform opacity-0 scale-95"
								enterTo="transform opacity-100 scale-100"
								leave="transition ease-in duration-75"
								leaveFrom="transform opacity-100 scale-100"
								leaveTo="transform opacity-0 scale-95">
								<MenuItems className="absolute right-0 z-30 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
									<div className="py-1 z-30">
										<MenuItem>
											{({ focus }) => (
												<a
													href="#"
													className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
													Day view
												</a>
											)}
										</MenuItem>
										<MenuItem>
											{({ focus }) => (
												<a
													href="#"
													className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
													Week view
												</a>
											)}
										</MenuItem>
										<MenuItem>
											{({ focus }) => (
												<a
													href="#"
													className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
													Month view
												</a>
											)}
										</MenuItem>
										<MenuItem>
											{({ focus }) => (
												<a
													href="#"
													className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
													Year view
												</a>
											)}
										</MenuItem>
									</div>
								</MenuItems>
							</Transition>
						</Menu>
						<div className="ml-6 h-6 w-px bg-gray-300" />
						<button
							type="button"
							className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
							Log Time
						</button>
					</div>
					<Menu as="div" className="relative ml-6 md:hidden">
						<MenuButton className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500">
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
							<MenuItems className="absolute right-0 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
								<div className="py-1">
									<MenuItem>
										{({ focus }) => (
											<a
												href="#"
												className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
												Create event
											</a>
										)}
									</MenuItem>
								</div>
								<div className="py-1">
									<MenuItem>
										{({ focus }) => (
											<a
												href="#"
												className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
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
												className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
												Day view
											</a>
										)}
									</MenuItem>
									<MenuItem>
										{({ focus }) => (
											<a
												href="#"
												className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
												Week view
											</a>
										)}
									</MenuItem>
									<MenuItem>
										{({ focus }) => (
											<a
												href="#"
												className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
												Month view
											</a>
										)}
									</MenuItem>
									<MenuItem>
										{({ focus }) => (
											<a
												href="#"
												className={classNames(focus ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}>
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
			<div ref={container} className="flex flex-auto flex-col overflow-auto bg-white">
				<div style={{ width: "165%" }} className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full">
					<div className="sticky z-10 top-0 flex-none bg-white shadow ring-1 ring-black ring-opacity-5 sm:pr-8">
						<div className="grid grid-cols-7 z-10 text-sm leading-6 text-gray-500 sm:hidden">
							{days.map((day, index) => (
								<button key={index} type="button" className="flex flex-col items-center pb-3 pt-2">
									{format(day, "EEE")[0]}{" "}
									<span
										className={classNames(
											isToday(day) ? "bg-indigo-600 text-white" : "text-gray-900",
											"mt-1 flex h-8 w-8 items-center justify-center font-semibold"
										)}>
										{format(day, "d")}
									</span>
								</button>
							))}
						</div>
						<div className="-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 sm:grid">
							<div className="col-end-1 w-14" />
							{days.map((day, index) => (
								<div key={index} className="flex items-center justify-center py-3">
									<span
										className={classNames(
											isToday(day) ? "bg-indigo-600 text-white p-3 rounded-md" : "text-gray-900",
											"flex items-baseline"
										)}>
										{format(day, "EEE")}{" "}
										<span
											className={classNames(
												isToday(day) ? "rounded-full bg-indigo-600 text-white" : "text-gray-900",
												"ml-1.5 flex h-8 w-8 items-center justify-center font-semibold"
											)}>
											{format(day, "d")}
										</span>
									</span>
								</div>
							))}
						</div>
					</div>
					<div className="flex flex-auto">
						<div className="sticky left-0 w-14 flex-none bg-white ring-1 ring-gray-100" />
						<div className="grid flex-auto grid-cols-1 grid-rows-1">
							{/* Horizontal lines */}
							<div
								className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
								style={{ gridTemplateRows: "repeat(24, minmax(4rem, 1fr))" }}>
								{[...Array(24)].map((_, hour) => (
									<div key={hour} className="relative h-full">
										<div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
											{hour % 12 === 0 ? 12 : hour % 12}
											{hour < 12 ? "AM" : "PM"}
										</div>
									</div>
								))}
							</div>

							{/* Vertical lines */}
							<div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7">
								<div className="col-start-1 row-span-full" />
								<div className="col-start-2 row-span-full" />
								<div className="col-start-3 row-span-full" />
								<div className="col-start-4 row-span-full" />
								<div className="col-start-5 row-span-full" />
								<div className="col-start-6 row-span-full" />
								<div className="col-start-7 row-span-full" />
								<div className="col-start-8 row-span-full w-8" />
							</div>

							{/* Events */}
							{/* Add your events here */}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
