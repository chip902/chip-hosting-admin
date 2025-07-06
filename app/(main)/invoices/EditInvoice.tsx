"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "@/app/validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { Cross1Icon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Form, FormField, FormLabel, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type CustomerSchema = z.infer<typeof customerSchema>;

interface EditCustomerProps {
	customer?: {
		id: number;
		name: string | null;
		email: string;
		dateCreated: Date;
		defaultRate: number;
		color: string | null;
	};
}

const EditInvoice = ({ customer }: EditCustomerProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [submitting, setSubmitting] = useState(false);

	const form = useForm<CustomerSchema>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			id: customer?.id,
			color: customer?.color || "#000000",
			email: customer?.email || "",
			name: customer?.name || "",
			defaultRate: customer?.defaultRate || 0,
		},
	});

	useEffect(() => {
		if (customer) {
			form.setValue("id", customer.id || undefined);
			form.setValue("name", customer.name || "");
			form.setValue("email", customer.email || "");
			form.setValue("defaultRate", customer.defaultRate || 0);
			form.setValue("color", customer.color || "#000000");
		}
	}, [customer, form]);

	const mutation = useMutation<void, Error, CustomerSchema>({
		mutationFn: async (data: CustomerSchema) => {
			const newData = {
				...data,
				defaultRate: parseFloat(data.defaultRate.toString()),
				color: data.color,
				name: data.name,
				email: data.email,
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
			form.setError("root", {
				message: "An unexpected error occurred",
			});
		},
	});

	const onSubmit = (data: CustomerSchema) => {
		setSubmitting(true);
		mutation.mutate(data);
	};

	return (
		<div className="flex flex-col gap-2">
			<Dialog>
				<DialogTrigger>
					<Button variant="ghost">
						<DotsVerticalIcon />
					</Button>
				</DialogTrigger>

				<DialogContent>
					<DialogTitle>
						<div className="flex justify-between">
							Edit Customer
							<DialogClose>
								<Button variant="ghost">
									<Cross1Icon />
								</Button>
							</DialogClose>
						</div>
					</DialogTitle>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Customer Name</FormLabel>
										<FormControl>
											<Input placeholder="Customer Name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Customer Email</FormLabel>
										<FormControl>
											<Input placeholder="Primary Email Address" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="defaultRate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Customer Rate</FormLabel>
										<FormControl>
											<Input
												placeholder="Rate per hour USD"
												type="number"
												{...field}
												onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="color"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Display Color</FormLabel>
										<FormControl>
											<input type="color" {...field} value={field.value || "#000000"} className="w-full h-10" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{form.formState.errors.root && <ErrorMessage>{form.formState.errors.root.message}</ErrorMessage>}

							<div className="flex gap-3 mt-4">
								<DialogClose>
									<Button type="button" variant="destructive">
										Cancel
									</Button>
								</DialogClose>
								<Button type="submit" variant="default" disabled={submitting}>
									{submitting && <Spinner />} Save
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default EditInvoice;
