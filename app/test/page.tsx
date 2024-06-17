"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

const MyComponent = () => {
	const [data, setData] = useState({ customers: [], projects: [], tasks: [] });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get("/api/data");
				setData(response.data);
			} catch (error) {
				setError("Error fetching data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;

	return (
		<div>
			<h1>Customers</h1>
			<ul>
				{data.customers.map((customer: any) => (
					<li key={customer.id}>{customer.name}</li>
				))}
			</ul>
			<h1>Projects</h1>
			<ul>
				{data.projects.map((project: any) => (
					<li key={project.id}>{project.name}</li>
				))}
			</ul>
			<h1>Tasks</h1>
			<ul>
				{data.tasks.map((task: any) => (
					<li key={task.id}>{task.name}</li>
				))}
			</ul>
		</div>
	);
};

export default MyComponent;
