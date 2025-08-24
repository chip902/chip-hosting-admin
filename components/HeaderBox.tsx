import React from "react";
import { HeaderBoxProps } from "@/types";
import { FadeIn } from "@/components/animations/FadeIn";
import { TextReveal } from "@/components/animations/TextReveal";
import { GradientBackground } from "@/components/animations/GradientBackground";

const HeaderBox: React.FC<HeaderBoxProps> = ({ type = "title", title, subtext, user }) => {
	return (
		<FadeIn>
			<GradientBackground variant="animated" className="header-box p-8 rounded-2xl mb-8">
				<div className="relative z-10">
					<TextReveal 
						text={`${title}${type === "greeting" && user ? ` ${user}` : ""}`}
						className="text-4xl md:text-6xl font-bold text-white mb-4"
					/>
					<FadeIn delay={0.5}>
						<p className="text-xl text-white/90 max-w-2xl">{subtext}</p>
					</FadeIn>
				</div>
			</GradientBackground>
		</FadeIn>
	);
};

export default HeaderBox;
