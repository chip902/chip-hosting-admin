import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { UpdateTimeEntryParams } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

const updateTimeEntry = async ({ id, data, timezone }: UpdateTimeEntryParams): Promise<AxiosResponse> => {
	try {
		console.log(`Updating time entry ${id} with data:`, data);

		// Use the correct API endpoint structure with the ID in the path
		const url = `/api/timelog/${id}`;

		// Create a clean object for Prisma fields only
		const prismaData: Record<string, any> = {};

		// Copy only the fields that exist in the Prisma schema
		// This avoids sending fields like startTime/endTime that don't exist in Prisma
		if (data.duration !== undefined) prismaData.duration = data.duration;
		if (data.description !== undefined) prismaData.description = data.description;
		
		// Handle date field - ensure it's a Date object for Prisma
		if (data.date) {
			prismaData.date = data.date instanceof Date ? data.date : new Date(data.date);
		}
		
		// If the frontend sent startTime/endTime, map them appropriately
		// They'll be handled differently based on your schema
		if (data.endTime) {
			// If endTime exists, use it for the endDate field in Prisma
			try {
				prismaData.endDate = new Date(data.endTime);
			} catch (e) {
				console.error('Failed to parse endTime', e);
			}
		}

		// Handle direct endDate field from drag/drop operations
		if (data.endDate) {
			try {
				prismaData.endDate = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
			} catch (e) {
				console.error('Failed to parse endDate', e);
			}
		}

		// If there's relevant data from your TimeEntry related fields,
		// extract just what Prisma needs
		const dataAny = data as any; // Cast to any to bypass TypeScript restrictions

		// Map related field IDs if they exist in the data
		if (dataAny.customer?.id) prismaData.customerId = dataAny.customer.id;
		if (dataAny.project?.id) prismaData.projectId = dataAny.project.id;
		if (dataAny.task?.id) prismaData.taskId = dataAny.task.id;
		if (dataAny.user?.id) prismaData.userId = dataAny.user.id;

		// Map any direct ID fields that might have been sent
		if (dataAny.customerId) prismaData.customerId = dataAny.customerId;
		if (dataAny.projectId) prismaData.projectId = dataAny.projectId;
		if (dataAny.taskId) prismaData.taskId = dataAny.taskId;
		if (dataAny.userId) prismaData.userId = dataAny.userId;

		// Map boolean fields
		if (dataAny.isClientInvoiced !== undefined) prismaData.isInvoiced = dataAny.isClientInvoiced;
		if (dataAny.isBillable !== undefined) prismaData.isBillable = dataAny.isBillable;

		console.log('Sending to Prisma:', prismaData);

		// Prepare query parameters with timezone if provided
		const queryParams = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';

		// Send a PATCH request with the properly formatted data for Prisma
		const response = await axios.patch(`${url}${queryParams}`, prismaData);

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
