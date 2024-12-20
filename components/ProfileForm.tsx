"use client";
import { profileFormSchema } from "@/app/validationSchemas";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@radix-ui/themes";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import router from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import PlaidLink from "./PlaidLink";
import { auth } from "@/auth";
import { User } from "next-auth";

const session = await auth();
const user = session?.user as unknown as User;

const ProfileForm = () => {
	const [loading, setLoading] = useState(false);
	const formSchema = profileFormSchema();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setLoading(true);
		try {
			console.log(data);

			const userData = {
				firstName: data.firstName!,
				lastName: data.lastName!,
				address: data.address!,
				city: data.city!,
				postalCode: data.postalCode!,
				dob: data.dob!,
				ssn: data.ssn!,
				address1: data.address!,
				dateOfBirth: data.dob!,
			};
			// const dwollaCustomerUrl = createDwollaCustomer({
			// 	...data,
			// 	type: "personal",
			// 	address1: data.address!,
			// 	dateOfBirth: data.dob!,
			// });
			// const dwollaCustomerID = extractCustomerIdFromUrl(dwollaCustomerUrl as unknown as string);
			const response = await axios.post("/api/user/update-user/", {
				...userData,
				// dwollaCustomerID,
				// dwollaCustomerUrl,
			});
			if (response.status === 201) {
				router.push("/admin/profile");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="auth-form">
			<header className="flex flex-col gap-5 md:gap-8">
				<Link href="/" className="cursor-pointer flex items-center gap-1 px-4">
					<Image className="rounded-lg" alt="Logo" width={34} height={34} src="/CHS_Logo.png" />
					<h2 className="header-2">Chip Hosting Solutions</h2>
				</Link>
				<div className="flex flex-col gap-1 md:gap-3">
					<PlaidLink variant="primary" user={user} />
				</div>
			</header>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<div className="flex flex-col gap-4">
						<Button disabled={loading} className="form-btn" type="submit">
							{loading ? <Spinner /> : "Save"}
						</Button>
					</div>
				</form>
			</Form>
		</section>
	);
};

export default ProfileForm;
