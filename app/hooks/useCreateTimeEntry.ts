import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timeLogSchema } from "../validationSchemas";
import axios from "axios";
import { z } from "zod";

type TimeLogSchema = z.infer<typeof timeLogSchema>;

const createTimeEntry = async (data: TimeLogSchema): Promise<void> => {
	try {
		// Log data before sending it to the backend for debugging purposes
		console.log("Data being sent to the backend:", data);

		const response = await axios.post(`/api/timelog`, data);

		if (response.status !== 201) {
			throw new Error("Error creating time entry");
		}

		return response.data;
	} catch (error) {
		// Log error details from the backend for more context
		if (axios.isAxiosError(error) && error.response) {
			console.error("Backend responded with:", error.response.data);
		}
		throw error;
	}
};

const useCreateTimeEntry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTimeEntry,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
			queryClient.refetchQueries;
		},
		onError: (error) => {
			console.error("Error creating time entry:", error);
		},
	});
};

export default useCreateTimeEntry;
