"use client";
import ProfileForm from "@/components/ProfileForm";
import React from "react";
import PlaidLink from "@/components/PlaidLink";

import { auth } from "@/auth";
import { User } from "@/types/index";

const session = await auth();
const user = session?.user as User;

const ProfilePage = () => {
	return <PlaidLink user={user} variant="primary" dwollaCustomerId={user.dwollaCustomerId || ""} />;
};

export default ProfilePage;
