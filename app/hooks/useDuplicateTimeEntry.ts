import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { timeLogSchema } from "../validationSchemas";
import axios from "axios";
import { z } from "zod";
import { addMinutes, format } from "date-fns";

type TimeLogSchema = z.infer<typeof timeLogSchema>;

const duplicateTimeEntry = async (originalEntryId: number): Promise<void> => {
	try {
		// First, fetch the original entry data
		const response = await axios.get(`/api/timelog/${originalEntryId}`);
		
		if (response.status !== 200) {
			throw new Error("Error fetching original time entry");
		}

		const originalEntry = response.data;
		
		// Create a new entry with the same data but offset by the duration
		const originalStartTime = new Date(originalEntry.startTime);
		const newStartTime = addMinutes(originalStartTime, originalEntry.duration);
		const newEndTime = addMinutes(newStartTime, originalEntry.duration);

		const duplicateData: TimeLogSchema = {
			customerId: originalEntry.customerId,
			projectId: originalEntry.projectId,
			taskId: originalEntry.taskId,
			userId: originalEntry.userId,
			duration: originalEntry.duration,
			date: format(newStartTime, "yyyy-MM-dd'T'HH:mm:ss"),
			description: originalEntry.description,
			startTime: format(newStartTime, "HH:mm"),
			endTime: format(newEndTime, "HH:mm"),
		};

		console.log("Duplicating time entry with data:", duplicateData);

		const createResponse = await axios.post(`/api/timelog`, duplicateData);

		if (createResponse.status !== 201) {
			throw new Error("Error creating duplicate time entry");
		}

		return createResponse.data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			console.error("Backend responded with:", error.response.data);
		}
		throw error;
	}
};

const useDuplicateTimeEntry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: duplicateTimeEntry,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
			queryClient.refetchQueries({ queryKey: ["timeEntries"] });
		},
		onError: (error) => {
			console.error("Error duplicating time entry:", error);
		},
	});
};

export default useDuplicateTimeEntry;