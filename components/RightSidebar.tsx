import { RightSidebarProps, User } from "@/types";
import BankCards from "./BankCards";

const RightSidebar: React.FC<RightSidebarProps> = ({ user }) => {
	if (!user) {
		return null;
	}

	return (
		<aside className="right-sidebar">
			<section className="flex flex-col pb-8">
				<div className="profile-banner" />
				<div className="profile">
					<div className="profile-img">
						<span className="text-5xl font-bold text-blue-500">{user.firstName?.[0] || "G"}</span>
					</div>
					<div className="profile-details">
						<h2 className="profile-name">
							{user.firstName} {user.lastName}
						</h2>
						<div className="profile-email">{user.email}</div>
					</div>
				</div>
			</section>
			<BankCards user={user} />
		</aside>
	);
};

export default RightSidebar;
