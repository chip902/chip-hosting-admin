import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
	return (
		<div className="flex-col gap-4">
			{[...Array(7)].map((_, dayIndex) => (
				<Skeleton key={dayIndex} className="w-full h-16" />
			))}
		</div>
	);
};

export default Loading;
