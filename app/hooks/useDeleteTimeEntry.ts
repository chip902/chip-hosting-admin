import { useMutation, UseMutationOptions, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { DeleteTimeEntryParams } from "@/types";

const deleteTimeEntry = async ({ id }: DeleteTimeEntryParams): Promise<AxiosResponse> => {
	try {
		const response = await axios.delete(`/api/timelog/${id}`);

		if (response.status !== 204) {
			throw new Error("Error deleting time entry");
		}

		return response;
	} catch (error) {
		console.error("Failed to delete time entry:", error);
		throw error;
	}
};

const useDeleteTimeEntry = (): UseMutationResult<AxiosResponse, unknown, DeleteTimeEntryParams> => {
	const queryClient = useQueryClient();
	const mutationOptions: UseMutationOptions<AxiosResponse, unknown, DeleteTimeEntryParams> = {
		mutationFn: deleteTimeEntry,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
		},
		onError: (error) => console.error("Delete Entry failed: ", error),
	};

	return useMutation(mutationOptions);
};

export default useDeleteTimeEntry;
