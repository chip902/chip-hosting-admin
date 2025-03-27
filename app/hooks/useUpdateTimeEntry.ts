import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { UpdateTimeEntryParams } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

const updateTimeEntry = async ({ id, data }: UpdateTimeEntryParams): Promise<AxiosResponse> => {
	try {
		console.log(`Updating time entry ${id} with data:`, data);

		// Create a URL with query parameters instead of sending a request body
		const url = new URL(`/api/timelog/position/${id}`, window.location.origin);

		// Add each property as a query parameter
		for (const key in data) {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				const value = data[key as keyof typeof data];

				// Handle date conversion specifically
				if (key === "date" && value && typeof value === "object") {
					try {
						// Check if the object has a toISOString method
						if ("toISOString" in value && typeof value.toISOString === "function") {
							url.searchParams.append(key, value.toISOString());
						} else {
							// If it's an object but not a Date, convert to string
							url.searchParams.append(key, JSON.stringify(value));
						}
					} catch (e) {
						// If toISOString fails, convert to string
						url.searchParams.append(key, String(value));
					}
				} else if (value !== undefined && value !== null) {
					// For non-date fields, convert to string
					url.searchParams.append(key, String(value));
				}
			}
		}

		// Use GET request instead of POST
		const response = await axios.get(url.toString());

		if (response.status !== 200) {
			console.error(`Received non-200 response: ${response.status}`, response.data);
			throw new Error(`Error updating time entry: ${response.statusText}`);
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
		onSuccess: (data, variables) => {
			console.log("Time entry updated successfully:", variables.id);
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
		},
		onError: (error) => {
			console.error("Update failed:", error);
		},
	};

	return useMutation(mutationOptions);
};

export default useUpdateTimeEntry;
