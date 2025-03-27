import * as React from "react";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const typographyVariants = cva("text-foreground", {
	variants: {
		variant: {
			h1: "text-4xl font-extrabold tracking-tight lg:text-5xl",
			h2: "text-3xl font-semibold tracking-tight",
			h3: "text-2xl font-semibold tracking-tight",
			h4: "text-xl font-semibold tracking-tight",
			h5: "text-lg font-semibold tracking-tight",
			h6: "text-base font-semibold tracking-tight",
			p: "leading-7",
			blockquote: "mt-6 border-l-2 pl-6 italic",
			ul: "my-6 ml-6 list-disc [&>li]:mt-2",
			ol: "my-6 ml-6 list-decimal [&>li]:mt-2",
			lead: "text-xl text-muted-foreground",
			large: "text-lg font-semibold",
			small: "text-sm font-medium leading-none",
			muted: "text-sm text-muted-foreground",
			subtle: "text-muted-foreground",
			destructive: "text-destructive",
		},
		size: {
			xs: "text-xs",
			sm: "text-sm",
			base: "text-base",
			lg: "text-lg",
			xl: "text-xl",
			"2xl": "text-2xl",
			"3xl": "text-3xl",
			"4xl": "text-4xl",
		},
		weight: {
			normal: "font-normal",
			medium: "font-medium",
			semibold: "font-semibold",
			bold: "font-bold",
		},
	},
	defaultVariants: {
		variant: "p",
		size: "base",
		weight: "normal",
	},
});

export interface TypographyProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
	asChild?: boolean;
	as?: React.ElementType;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
	({ className, variant, size, weight, as: Component = "p", asChild = false, ...props }, ref) => {
		return <Component className={cn(typographyVariants({ variant, size, weight, className }))} ref={ref} {...props} />;
	}
);

Typography.displayName = "Typography";

export { Typography, typographyVariants };
