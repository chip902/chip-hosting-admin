"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, FolderOpen, Image as ImageIcon, Users, Plus, ArrowRight, Loader2, TrendingUp, Calendar, Eye, Edit3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import PostsManager from "../posts/PostsManager";
import CategoriesManager from "../categories/CategoriesManager";
import MediaManager from "../media/MediaManager";
import UsersManager from "../users/UsersManager";

type AdminDashboardProps = {
	segments?: string[];
	searchParams?: { [key: string]: string | string[] };
};

type CollectionStats = {
	posts: { total: number; published: number; draft: number };
	categories: { total: number };
	media: { total: number; images: number; documents: number };
	users: { total: number; admins: number };
};

export default function AdminDashboard({ segments, searchParams }: AdminDashboardProps) {
	const [stats, setStats] = useState<CollectionStats>({
		posts: { total: 0, published: 0, draft: 0 },
		categories: { total: 0 },
		media: { total: 0, images: 0, documents: 0 },
		users: { total: 1, admins: 1 },
	});
	const [loading, setLoading] = useState(true);
	const [recentPosts, setRecentPosts] = useState<any[]>([]);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			// Fetch stats from Payload API
			const [postsRes, categoriesRes, mediaRes, usersRes] = await Promise.all([
				fetch("/api/posts?limit=5&sort=-createdAt").catch(() => null),
				fetch("/api/categories").catch(() => null),
				fetch("/api/media").catch(() => null),
				fetch("/api/users").catch(() => null),
			]);

			if (postsRes?.ok) {
				const postsData = await postsRes.json();
				setRecentPosts(postsData.docs || []);
				setStats((prev) => ({
					...prev,
					posts: {
						total: postsData.totalDocs || 0,
						published: postsData.docs?.filter((p: any) => p.status === "published").length || 0,
						draft: postsData.docs?.filter((p: any) => p.status === "draft").length || 0,
					},
				}));
			}

			if (categoriesRes?.ok) {
				const categoriesData = await categoriesRes.json();
				setStats((prev) => ({
					...prev,
					categories: { total: categoriesData.totalDocs || 0 },
				}));
			}

			if (mediaRes?.ok) {
				const mediaData = await mediaRes.json();
				setStats((prev) => ({
					...prev,
					media: {
						total: mediaData.totalDocs || 0,
						images: mediaData.docs?.filter((m: any) => m.mimeType?.startsWith("image/")).length || 0,
						documents: mediaData.docs?.filter((m: any) => !m.mimeType?.startsWith("image/")).length || 0,
					},
				}));
			}

			if (usersRes?.ok) {
				const usersData = await usersRes.json();
				setStats((prev) => ({
					...prev,
					users: {
						total: usersData.totalDocs || 0,
						admins: usersData.docs?.filter((u: any) => u.role === "admin").length || 0,
					},
				}));
			}
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	// Handle different admin routes
	const currentPage = segments?.[0] || "dashboard";

	// Route to specific collection views
	if (currentPage === "posts") {
		return <PostsManager />;
	}
	if (currentPage === "categories") {
		return <CategoriesManager />;
	}
	if (currentPage === "media") {
		return <MediaManager />;
	}
	if (currentPage === "users") {
		return <UsersManager />;
	}

	// Main dashboard view
	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
						Content Studio
					</h1>
					<p className="text-muted-foreground mt-2">Create, manage, and publish your digital content</p>
				</div>
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" asChild>
						<Link href="/cms-admin/posts">
							<Eye className="mr-2 h-4 w-4" />
							View Site
						</Link>
					</Button>
					<Button size="sm" asChild>
						<Link href="/cms-admin/posts/new">
							<Edit3 className="mr-2 h-4 w-4" />
							Write Post
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/20">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Posts</CardTitle>
						<div className="p-2 bg-blue-500/10 rounded-lg">
							<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
							{loading ? <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> : stats.posts.total}
						</div>
						<div className="flex items-center gap-2 mt-2">
							<TrendingUp className="h-3 w-3 text-green-500" />
							<p className="text-xs text-blue-600 dark:text-blue-400">
								{stats.posts.published} published • {stats.posts.draft} drafts
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/20">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Categories</CardTitle>
						<div className="p-2 bg-emerald-500/10 rounded-lg">
							<FolderOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
							{loading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-600" /> : stats.categories.total}
						</div>
						<p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Content organization</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/20">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Media Assets</CardTitle>
						<div className="p-2 bg-purple-500/10 rounded-lg">
							<ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
							{loading ? <Loader2 className="h-6 w-6 animate-spin text-purple-600" /> : stats.media.total}
						</div>
						<p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
							{stats.media.images} images • {stats.media.documents} files
						</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/20">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Team Members</CardTitle>
						<div className="p-2 bg-orange-500/10 rounded-lg">
							<Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
							{loading ? <Loader2 className="h-6 w-6 animate-spin text-orange-600" /> : stats.users.total}
						</div>
						<p className="text-xs text-orange-600 dark:text-orange-400 mt-2">{stats.users.admins} administrators</p>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div>
				<h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card
						className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-dashed border-2 hover:border-solid hover:border-primary/50"
						onClick={() => (window.location.href = "/cms-admin/posts/new")}>
						<CardHeader className="text-center pb-4">
							<div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
								<Edit3 className="h-6 w-6 text-primary" />
							</div>
							<CardTitle className="text-lg">New Post</CardTitle>
							<CardDescription>Start writing your next article</CardDescription>
						</CardHeader>
					</Card>

					<Card
						className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-dashed border-2 hover:border-solid hover:border-purple-500/50"
						onClick={() => (window.location.href = "/cms-admin/media")}>
						<CardHeader className="text-center pb-4">
							<div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
								<ImageIcon className="h-6 w-6 text-purple-500" />
							</div>
							<CardTitle className="text-lg">Manage Media</CardTitle>
							<CardDescription>Upload and organize assets</CardDescription>
						</CardHeader>
					</Card>

					<Card
						className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-dashed border-2 hover:border-solid hover:border-emerald-500/50"
						onClick={() => (window.location.href = "/cms-admin/categories")}>
						<CardHeader className="text-center pb-4">
							<div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
								<FolderOpen className="h-6 w-6 text-emerald-500" />
							</div>
							<CardTitle className="text-lg">Categories</CardTitle>
							<CardDescription>Organize your content topics</CardDescription>
						</CardHeader>
					</Card>

					<Card
						className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-dashed border-2 hover:border-solid hover:border-orange-500/50"
						onClick={() => (window.location.href = "/cms-admin/users")}>
						<CardHeader className="text-center pb-4">
							<div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
								<Users className="h-6 w-6 text-orange-500" />
							</div>
							<CardTitle className="text-lg">Team</CardTitle>
							<CardDescription>Manage user accounts</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</div>

			{/* Recent Posts */}
			<Card className="border-0 shadow-sm bg-gradient-to-r from-background to-muted/20">
				<CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-primary/10 rounded-lg">
								<Calendar className="h-5 w-5 text-primary" />
							</div>
							<div>
								<CardTitle className="text-xl">Recent Activity</CardTitle>
								<CardDescription>Your latest content updates</CardDescription>
							</div>
						</div>
						<Button variant="ghost" size="sm" className="group" asChild>
							<Link href="/cms-admin/posts">
								View all posts
								<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
							</Link>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center">
								<Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
								<p className="text-muted-foreground">Loading recent posts...</p>
							</div>
						</div>
					) : recentPosts.length > 0 ? (
						<div className="space-y-4">
							{recentPosts.map((post, index) => (
								<div
									key={post.id}
									className="group flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-all duration-200 hover:border-primary/20">
									<div className="flex items-center gap-4">
										<div className="flex-shrink-0">
											<div
												className={cn(
													"w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
													post.status === "published"
														? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
														: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
												)}>
												{index + 1}
											</div>
										</div>
										<div className="space-y-1">
											<p className="font-semibold group-hover:text-primary transition-colors">{post.title}</p>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<span
													className={cn(
														"px-2 py-1 rounded-full text-xs font-medium",
														post.status === "published"
															? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
															: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
													)}>
													{post.status === "published" ? "Published" : "Draft"}
												</span>
												<span>•</span>
												<span>{new Date(post.createdAt).toLocaleDateString()}</span>
											</div>
										</div>
									</div>
									<Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
										<Link href={`/cms-admin/posts/${post.id}`}>
											<Edit3 className="h-4 w-4 mr-2" />
											Edit
										</Link>
									</Button>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
								<FileText className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold mb-2">No posts yet</h3>
							<p className="text-muted-foreground mb-4">Start creating content for your audience</p>
							<Button asChild>
								<Link href="/cms-admin/posts/new">
									<Edit3 className="mr-2 h-4 w-4" />
									Create your first post
								</Link>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
