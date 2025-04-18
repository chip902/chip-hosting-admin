"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Customer } from "@/prisma/app/generated/prisma/client";

type CustomerSchema = z.infer<typeof customerSchema>;

const AddCustomer = ({ customer }: { customer?: Customer }) => {
	const router = useRouter();
	const form = useForm<CustomerSchema>({
		resolver: zodResolver(customerSchema),
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async (data: CustomerSchema) => {
		try {
			setSubmitting(true);
			const newData = {
				...data,
				rate: parseFloat(data.defaultRate.toString()),
			};

			if (customer) {
				await axios.patch("/api/customers/" + customer.id, newData);
			} else {
				await axios.post("/api/customers", newData);
			}
			setSubmitting(false);
			router.push("/customers");
			router.refresh();
		} catch (error) {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
			setError("An unexpected error occurred");
		}
	};

	return (
		<div className="flex-col gap-2">
			<Dialog>
				<DialogTrigger>
					<Button className="payment-transfer_btn">Add Customer</Button>
				</DialogTrigger>

				<DialogContent className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
					<DialogTitle className="text-20 font-semibold text-gray-900 dark:text-gray-100 mb-6">Add A New Customer</DialogTitle>
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
										<Button type="button" color="red" size="lg">
											Cancel
										</Button>
									</DialogClose>

									<Button type="submit" variant="default" color="green" size="lg" disabled={submitting}>
										{submitting && <Spinner />} Add
									</Button>
								</div>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AddCustomer;
