// app/transactions/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function TransactionsLayout({ children, error }: any) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	// If there's an error component, clone it and pass the userId
	const errorComponent = error
		? React.cloneElement(error as React.ReactElement, {
				userId: session.user.id,
		  })
		: null;

	return <div className="transactions-layout">{errorComponent || children}</div>;
}
