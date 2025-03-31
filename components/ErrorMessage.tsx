import React, { PropsWithChildren } from "react";
import { Alert } from "./ui/alert";

const ErrorMessage = ({ children }: PropsWithChildren) => {
	if (!children) return;
	return <Alert color="red">{children}</Alert>;
};

export default ErrorMessage;
