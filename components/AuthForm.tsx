"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { z } from "zod";
import CustomInput from "./CustomInput";
import { authFormSchema } from "@/app/validationSchemas";
import { Spinner } from "@radix-ui/themes";

const AuthForm = ({ type }: { type: string }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(false);
	const formSchema = authFormSchema(type);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		setLoading(true);
		console.log(values);
		setLoading(false);
	}

	return (
		<section className="auth-form">
			<header className="flex flex-col gap-5 md:gap-8">
				<Link href="/" className="cursor-pointer flex items-center gap-1 px-4">
					<Image className="rounded-lg" alt="Logo" width={34} height={34} src="/CHS_Logo.png" />
					<h2 className="header-2">Chip Hosting Solutions</h2>
				</Link>
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-24 lg:text-36 font-semibold text-gray-900">
						{user ? "Link Account" : type === "sign-in" ? "Sign In" : "Sign Up"}

						<p className="text-16 font-normal text-gray-600">{user ? "Link Account To Get Started" : "Please enter your details..."}</p>
					</h1>
				</div>
			</header>
			{user ? (
				<div className="flex flex-col gap-4">{/** PLAID LINK ACCOUNT */}</div>
			) : (
				<>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
							{type === "sign-up" && (
								<>
									<CustomInput control={form.control} name="firstName" label="First Name" placeholder="ex. Joe" />
									<CustomInput control={form.control} name="lastName" label="Last Name" placeholder="ex. Smith" />
									<CustomInput control={form.control} name="address" label="Address" placeholder="1234 Main St." />
									<CustomInput control={form.control} name="state" label="State" placeholder="ex. NY" />
									<CustomInput control={form.control} name="postalCode" label="Postal Code" placeholder="ex. 10001" />
									<CustomInput control={form.control} name="dob" label="Date of Birth" placeholder="ex. YYYY-MM-DD" />
									<CustomInput control={form.control} name="ssn" label="Last 4 of SSN" placeholder="ex. 1234" />
								</>
							)}
							<CustomInput control={form.control} name="email" label="Email" placeholder="Enter your Email" />
							<CustomInput control={form.control} name="password" label="Password" placeholder="Enter Password" />
							<div className="flex flex-col gap-4">
								<Button disabled={loading} className="form-btn" type="submit">
									{loading ? <Spinner /> : "Submit"}
								</Button>
							</div>
						</form>
					</Form>
					<footer className="flex justify-center gap-1">
						<p className="text-14 font-normal text-gray-600">{type === "sign-in" ? "Don't have an account?" : "Already have an account?"}</p>
						<Link className="form-link" href={type === "sign-in" ? "/sign-up" : "/sign-in"}>
							{type === "sign-in" ? "Sign Up" : "Sign In"}
						</Link>
					</footer>
				</>
			)}
		</section>
	);
};

export default AuthForm;
