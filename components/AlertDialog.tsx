import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import React, { ReactNode } from "react";

const AlertDialoge = (error: any) => {
	return (
		<AlertDialog.Root defaultOpen={true}>
			<AlertDialog.Content maxWidth="450px">
				<AlertDialog.Title>Error</AlertDialog.Title>
				<AlertDialog.Description size="2">The Database could not be updated. {error} Check your connection and try again.</AlertDialog.Description>
				<Flex gap="3" mt="4" justify="end">
					<AlertDialog.Cancel>
						<Button color="red">Dismiss</Button>
					</AlertDialog.Cancel>
				</Flex>
			</AlertDialog.Content>
		</AlertDialog.Root>
	);
};

export default AlertDialoge;
