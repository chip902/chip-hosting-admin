"use client";
import { useState } from "react";
import axios from "axios";

const BookingForm = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [date, setDate] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		//e.preventDefault();

		try {
			const response = await axios.post("/api/bookings", {
				name,
				email,
				date,
				startTime,
				endTime,
			});
			console.log("Booking created:", response.data);
		} catch (error) {
			console.error("Failed to create booking:", error);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col space-y-4">
			<input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border p-2" />
			<input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2" />
			<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2" />
			<input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border p-2" />
			<input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border p-2" />
			<button type="submit" className="bg-blue-500 text-white p-2 rounded">
				Book Appointment
			</button>
		</form>
	);
};

export default BookingForm;
