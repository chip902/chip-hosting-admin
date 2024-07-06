import { Flex, Skeleton } from "@radix-ui/themes";
import React from "react";

const LoadingTimeGrid = () => {
	return (
		<Flex direction="column" gap="5" maxWidth="350px">
			<Skeleton />
		</Flex>
	);
};

export default LoadingTimeGrid;
