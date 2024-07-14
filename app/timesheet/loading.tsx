import { Flex, Skeleton } from "@radix-ui/themes";

const Loading = () => {
	return (
		<Flex direction="column" gap="4">
			{[...Array(7)].map((_, dayIndex) => (
				<Skeleton key={dayIndex} className="w-full h-16" />
			))}
		</Flex>
	);
};

export default Loading;
