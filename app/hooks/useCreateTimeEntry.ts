import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timeLogSchema } from "../validationSchemas";
import axios from "axios";
import { z } from "zod";

type TimeLogSchema = z.infer<typeof timeLogSchema>;

const createTimeEntry = async (data: TimeLogSchema): Promise<void> => {
	const response = await axios.post(`/api/timelog`, data);

	if (response.status !== 201) {
		throw new Error("Error creating time entry");
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
	});
};

export default useCreateTimeEntry;
