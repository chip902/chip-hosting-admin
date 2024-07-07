import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const deleteTimeEntry = async (id: number): Promise<void> => {
	const response = await axios.delete(`/api/timelog/${id}`);

	if (response.status !== 204) {
		throw new Error("Error deleting time entry");
	}
};

const useDeleteTimeEntry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteTimeEntry,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
			queryClient.refetchQueries;
		},
	});
};

export default useDeleteTimeEntry;
