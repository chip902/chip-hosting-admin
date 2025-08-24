import React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const AlertDialogComponent = ({ error }: { error: any }) => {
	return (
		<AlertDialog defaultOpen>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Error</AlertDialogTitle>
					<AlertDialogDescription>The Database could not be updated. {error} Check your connection and try again.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogAction asChild>
						<Button variant="brand-primary">Dismiss</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default AlertDialogComponent;
