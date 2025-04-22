"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import PlaidLink from "./PlaidLink";
import { authFormSchema } from "@/app/validationSchemas";
import { signIn } from "next-auth/react";
import axios from "axios";
import { User } from "@/types";

const AuthForm = ({ type }: { type: string }) => {
	const router = useRouter();
	const [user, setUser] = useState<User>();
	const [isLoading, setIsLoading] = useState(false);

	const formSchema = authFormSchema(type);

	// 1. Define your form.
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	// 2. Define a submit handler.
	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		console.log("onSubmit function reached with data:", data);

		setIsLoading(true);

		try {
			if (type === "sign-up") {
				const userData = {
					firstName: data.firstName!,
					lastName: data.lastName!,
					address: data.address!,
					city: data.city!,
					state: data.state!,
					postalCode: data.postalCode!,
					dateOfBirth: data.dob!,
					ssn: data.ssnLastFour!,
					email: data.email,
					password: data.password,
				};

				const newUser = (await axios.post("/api/user/new-user", userData)).data as User;
				setUser(newUser);
			}

			if (type === "sign-in") {
				const response = await signIn("credentials", {
					email: data.email,
					password: data.password,
					redirect: false,
				});

				if (response?.ok) router.push("/");
			}
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
        (<section className="auth-form">
            <header className="flex flex-col gap-5 md:gap-8">
				<Link
                    href="/"
                    className="cursor-pointer flex items-center gap-1"
                    legacyBehavior>
					<Image src="/CHS_Logo.png" width={34} height={34} alt="logo" />
					<h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">Chip Hosting Solutions</h1>
				</Link>

				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-24 lg:text-36 font-semibold text-gray-900">
						{user ? "Link Account" : type === "sign-in" ? "Sign In" : "Sign Up"}
						<p className="text-16 font-normal text-gray-600">{user ? "Link your account to get started" : "Please enter your details"}</p>
					</h1>
				</div>
			</header>
            {user ? (
				<div className="flex flex-col gap-4">
					<PlaidLink user={user} variant="primary" />
				</div>
			) : (
				<>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
							{type === "sign-up" && (
								<>
									<div className="flex gap-4">
										<FormField
											control={form.control}
											name="firstName"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormLabel>First Name</FormLabel>
													<FormControl>
														<Input placeholder="Enter your first name" {...field} value={field.value as string} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="lastName"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormLabel>Last Name</FormLabel>
													<FormControl>
														<Input placeholder="Enter your last name" {...field} value={field.value as string} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<FormField
										control={form.control}
										name="address"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Address</FormLabel>
												<FormControl>
													<Input placeholder="Enter your specific address" {...field} value={field.value as string} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="city"
										render={({ field }) => (
											<FormItem>
												<FormLabel>City</FormLabel>
												<FormControl>
													<Input placeholder="Enter your city" {...field} value={field.value as string} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="flex gap-4">
										<FormField
											control={form.control}
											name="state"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormLabel>State</FormLabel>
													<FormControl>
														<Input placeholder="Example: NY" {...field} value={field.value as string} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="postalCode"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormLabel>Postal Code</FormLabel>
													<FormControl>
														<Input placeholder="Example: 11101" {...field} value={field.value as string} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="flex gap-4">
										<FormField
											control={form.control}
											name="dob"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormLabel>Date of Birth</FormLabel>
													<FormControl>
														<Input placeholder="YYYY-MM-DD" {...field} value={field.value as string} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="ssnLastFour"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormLabel>SSN</FormLabel>
													<FormControl>
														<Input placeholder="Example: 1234" {...field} value={field.value as string} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</>
							)}

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder="Enter your email" {...field} value={field.value as string} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input type="password" placeholder="Enter your password" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex flex-col gap-4">
								<Button type="submit" disabled={isLoading} className="form-btn">
									{isLoading ? (
										<>
											<Loader2 size={20} className="animate-spin mr-2" /> Loading...
										</>
									) : type === "sign-in" ? (
										"Sign In"
									) : (
										"Sign Up"
									)}
								</Button>
							</div>
						</form>
					</Form>

					<footer className="flex justify-center gap-1">
						<p className="text-14 font-normal text-gray-600">{type === "sign-in" ? "Don't have an account?" : "Already have an account?"}</p>
						<Link
                            href={type === "sign-in" ? "/sign-up" : "/sign-in"}
                            className="form-link"
                            legacyBehavior>
							{type === "sign-in" ? "Sign up" : "Sign in"}
						</Link>
					</footer>
				</>
			)}
        </section>)
    );
};

export default AuthForm;
