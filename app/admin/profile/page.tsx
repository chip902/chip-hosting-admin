"use client";

import PlaidLink from "@/components/PlaidLink";
import { useSession } from "next-auth/react";

const ProfilePage = () => {
	const sessionResult = useSession(); // Store the result in a variable

	if (sessionResult === undefined) {
		// Handle the case where sessionResult is undefined
		return <div>Session not available</div>;
	}

	const { data: session, status } = sessionResult; // Now safely destructure

	if (status === "loading") {
		return <div>Loading...</div>;
	}

	if (!session || !session.user) {
		return <div>User not found</div>;
	}

	return <PlaidLink user={session.user} variant="primary" />;
};

export default ProfilePage;
