import { authFormSchema, profileFormSchema } from "@/app/validationSchemas";
import { FormField, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";
import { Control, FieldPath } from "react-hook-form";
import { z } from "zod";

const formSchema = authFormSchema("sign-up");
const customerSchema = authFormSchema("customer");
const profileSchema = profileFormSchema();

interface CustomInputProps {
	control: Control<z.infer<typeof formSchema | typeof customerSchema | typeof profileSchema>>;
	name: FieldPath<z.infer<typeof formSchema>>;
	label: string;
	placeholder: string;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomInput = ({ control, name, label, placeholder }: CustomInputProps) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<div className="form-item">
					<FormLabel className="form-label">{label}</FormLabel>
					<div className="flex w-full flex-col">
						<FormControl>
							<Input type={name} placeholder={placeholder} className="input-class" {...field} />
						</FormControl>
						<FormMessage className="form-message mt-2"></FormMessage>
					</div>
				</div>
			)}
		/>
	);
};

export default CustomInput;
