import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const updateTimeEntry = async ({ id, data }: { id: number; data: object }) => {
	const response = await axios.patch(`/api/timelog/${id}`, data);
	if (response.status !== 200) {
		throw new Error("Error updating time entry");
	}
	return response.data;
};

const useUpdateTimeEntry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateTimeEntry,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
		},
	});
};

export default useUpdateTimeEntry;
