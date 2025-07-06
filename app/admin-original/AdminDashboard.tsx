"use client";
import { useState, useEffect } from "react";
import axios from "axios";

interface IBooking {
	id: number;
	name: string;
	email: string;
	date: string;
	startTime: string;
	endTime: string;
}

const AdminDashboard = () => {
	const [bookings, setBookings] = useState<IBooking[]>([]);

	const fetchBookings = async () => {
		try {
			const response = await axios.get("/api/bookings");
			console.log("API Response:", response.data); // Log the response data
			if (response.data && Array.isArray(response.data.booking)) {
				setBookings(response.data.booking);
			} else {
				console.error("Data is not an array:", response.data);
			}
		} catch (error) {
			console.error("Failed to fetch bookings:", error);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await axios.delete(`/api/bookings/${id}`);
			fetchBookings(); // Refresh the bookings list
		} catch (error) {
			console.error("Failed to delete booking:", error);
		}
	};

	useEffect(() => {
		fetchBookings();
	}, []);

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
			<table className="table-auto w-full">
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Date</th>
						<th>Start Time</th>
						<th>End Time</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{Array.isArray(bookings) && bookings.length > 0 ? (
						bookings.map((booking) => (
							<tr key={booking.id}>
								<td>{booking.name}</td>
								<td>{booking.email}</td>
								<td>{new Date(booking.date).toLocaleDateString()}</td>
								<td>{new Date(booking.startTime).toLocaleTimeString()}</td>
								<td>{new Date(booking.endTime).toLocaleTimeString()}</td>
								<td>
									<button onClick={() => handleDelete(booking.id)} className="bg-red-500 text-white p-1 rounded">
										Delete
									</button>
								</td>
							</tr>
						))
					) : (
						<tr>
							<td colSpan={6} className="text-center">
								No bookings found.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default AdminDashboard;
