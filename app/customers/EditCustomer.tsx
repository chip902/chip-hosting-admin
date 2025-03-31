"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { Cross1Icon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CustomerSchema = z.infer<typeof customerSchema>;

interface EditCustomerProps {
	customer?: {
		id: number;
		name: string | null;
		shortName: string | null;
		email: string;
		dateCreated: Date;
		defaultRate: number;
		color: string | null;
		paymentTerms: string | null;
	};
}

const EditCustomer = ({ customer }: EditCustomerProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const form = useForm<CustomerSchema>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			id: customer?.id,
			color: customer?.color || "",
			email: customer?.email || "",
			name: customer?.name || "",
			shortname: customer?.shortName || "",
			defaultRate: customer?.defaultRate || 0,
			paymentTerms: customer?.paymentTerms || "30",
		},
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (customer) {
			form.setValue("id", customer.id || undefined);
			form.setValue("name", customer.name || "");
			form.setValue("shortname", customer.shortName || "");
			form.setValue("email", customer.email || "");
			form.setValue("defaultRate", customer.defaultRate || 0);
			form.setValue("color", customer.color || "#000000");
		}
	}, [customer, form.setValue]);

	const mutation = useMutation<void, Error, CustomerSchema>({
		mutationFn: async (data: CustomerSchema) => {
			const newData = {
				...data,
				defaultRate: parseFloat(data.defaultRate.toString()),
				color: data.color,
				name: data.name,
				shortname: data.shortname,
				email: data.email,
				paymentTerms: data.paymentTerms,
			};

			if (customer) {
				await axios.patch(`/api/customers/${customer.id}`, newData);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			setSubmitting(false);
			router.push("/customers");
			router.refresh();
		},
		onError: (error: Error) => {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
			setError("An unexpected error occurred");
		},
	});

	const onSubmit = (data: CustomerSchema) => {
		setSubmitting(true);
		mutation.mutate(data);
	};

	return (
		<Dialog>
			<DialogTrigger>
				<Button variant="ghost" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
					<DotsVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
				</Button>
			</DialogTrigger>

			<DialogContent className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
				<div className="flex justify-between items-center mb-6">
					<DialogTitle className="text-20 font-semibold text-gray-900 dark:text-gray-100">Edit Customer</DialogTitle>
					<DialogClose>
						<Button variant="ghost" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
							<Cross1Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
						</Button>
					</DialogClose>
				</div>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="flex flex-col">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel className="form-label">Customer Name</FormLabel>
										<FormControl>
											<Input className="form-item" placeholder="Customer Name" {...form.register("name", field)} />
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>
							<FormField
								control={form.control}
								name="shortName"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel className="form-label">Short Name</FormLabel>
										<FormControl>
											<Input className="form-item" placeholder="Invoice Code" {...form.register("shortName", field)} />
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel className="form-label">Customer Email</FormLabel>
										<FormControl>
											<Input className="form-item" type="email" placeholder="Customer Email" {...form.register("email", field)} />
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="defaultRate"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel className="form-label">Customer Rate</FormLabel>
										<FormControl>
											<Input
												className="form-item"
												type="number"
												placeholder="Rate per hour USD"
												{...form.register("defaultRate", field)}
											/>
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="paymentTerms"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel className="form-label">Payment Terms</FormLabel>
										<FormControl>
											<Input
												className="form-item"
												type="number"
												placeholder="ex. 30, for Net 30 Days"
												{...form.register("paymentTerms", field)}
											/>
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="color"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel className="form-label">Display Color</FormLabel>
										<FormControl>
											<Input type="color" className="form-item" placeholder="Display Color" {...form.register("color", field)} />
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>

							<div className="flex justify-end gap-4 mt-6">
								<DialogClose>
									<Button
										type="button"
										variant="outline"
										className="text-14 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
										Cancel
									</Button>
								</DialogClose>

								<Button type="submit" className="payment-transfer_btn" disabled={submitting}>
									{submitting && <Spinner />} Save
								</Button>
							</div>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default EditCustomer;
