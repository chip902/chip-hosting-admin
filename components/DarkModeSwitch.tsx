"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
	const [isDarkMode, setIsDarkMode] = useState(false);

	useEffect(() => {
		if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
			document.documentElement.classList.add("dark");
			setIsDarkMode(true);
		} else {
			document.documentElement.classList.remove("dark");
			setIsDarkMode(false);
		}
	}, []);

	const toggleDarkMode = () => {
		if (isDarkMode) {
			document.documentElement.classList.remove("dark");
			localStorage.theme = "light";
		} else {
			document.documentElement.classList.add("dark");
			localStorage.theme = "dark";
		}
		setIsDarkMode(!isDarkMode);
	};

	return (
		<button
			onClick={toggleDarkMode}
			className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
			aria-label="Toggle Dark Mode">
			{isDarkMode ? <Sun className="text-yellow-500" /> : <Moon className="text-gray-800 dark:text-gray-200" />}
		</button>
	);
}
