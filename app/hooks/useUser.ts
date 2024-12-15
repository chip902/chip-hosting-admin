import { User } from "@/types";
import { useQuery } from "@tanstack/react-query";

const fetchUser = async (): Promise<User> => {
	const response = await fetch("/api/user");
	if (!response.ok) {
		throw new Error("Failed to fetch user");
	}
	return response.json();
};

const useUser = () => {
	const {
		data: user,
		isLoading,
		isError,
	} = useQuery<User, Error>({
		queryKey: ["user"],
		queryFn: fetchUser,
	});

	return { user, isLoading, isError };
};

export default useUser;
