import React from "react";
import { HeaderBoxProps } from "@/types";

const HeaderBox: React.FC<HeaderBoxProps> = ({ type = "title", title, subtext, user }) => {
	console.log("HeaderBox rendered with type:", type, "and user:", user);
	return (
		<div className="header-box">
			<h1 className="header-box-title">
				{title}
				{type === "greeting" && user && <span className="text-bankGradient">&nbsp;{user}</span>}
			</h1>
			<p className="header-box-subtext">{subtext}</p>
		</div>
	);
};

export default HeaderBox;
