import PlaidLink from "@/components/PlaidLink";
import { useSession } from "next-auth/react";

const ProfilePage = () => {
	const { data: session, status } = useSession();

	if (status === "loading") {
		return <div>Loading...</div>; // Render a loading state or spinner
	}

	if (!session || !session.user) {
		return <div>User not found</div>; // Handle the case where user is still null after loading
	}

	return <PlaidLink user={session.user} variant="primary" dwollaCustomerId={session.user.dwollaCustomerId || ""} />;
};

export default ProfilePage;
