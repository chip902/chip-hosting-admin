import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { UpdateTimeEntryParams } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

const updateTimeEntry = async ({ id, data }: UpdateTimeEntryParams): Promise<AxiosResponse> => {
	try {
		const response = await axios.patch(`/api/timelog/${id}`, data);
		if (response.status !== 200) {
			throw new Error("Error updating time entry");
		}
		return response;
	} catch (error) {
		console.error("Failed to update time entry:", error);
		throw error;
	}
};

const useUpdateTimeEntry = (): UseMutationResult<AxiosResponse, unknown, UpdateTimeEntryParams> => {
	const queryClient = useQueryClient();
	const mutationOptions: UseMutationOptions<AxiosResponse, unknown, UpdateTimeEntryParams> = {
		mutationFn: updateTimeEntry,
		onSuccess: (data) => {
			console.log("Updated successfully:", data);
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
		},
		onError: (error) => console.error("Update failed:", error),
	};

	return useMutation(mutationOptions);
};

export default useUpdateTimeEntry;
