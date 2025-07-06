"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import axios from "axios";

const postSchema = z.object({
	title: z.string().min(1, "Title is required"),
	slug: z.string().min(1, "Slug is required"),
	content: z.string().min(1, "Content is required"),
	excerpt: z.string().optional(),
	status: z.enum(["draft", "published"]),
	category: z.string().optional(),
	featuredImage: z.string().optional(),
	seo: z
		.object({
			title: z.string().optional(),
			description: z.string().optional(),
			keywords: z.string().optional(),
		})
		.optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostEditorProps {
	postId: string;
}

export default function PostEditor({ postId }: PostEditorProps) {
	const router = useRouter();
	const isNew = postId === "new";
	const [loading, setLoading] = useState(!isNew);
	const [saving, setSaving] = useState(false);
	const [categories, setCategories] = useState<any[]>([]);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
		reset,
	} = useForm<PostFormData>({
		resolver: zodResolver(postSchema),
		defaultValues: {
			status: "draft",
			category: "none",
			seo: {},
		},
	});

	const watchTitle = watch("title");
	const watchStatus = watch("status");

	useEffect(() => {
		fetchCategories();
		if (!isNew) {
			fetchPost();
		}
	}, [postId]);

	useEffect(() => {
		// Auto-generate slug from title
		if (watchTitle && isNew) {
			const slug = watchTitle
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)/g, "");
			setValue("slug", slug);
		}
	}, [watchTitle, isNew, setValue]);

	const fetchCategories = async () => {
		try {
			const response = await fetch("/api/categories");
			if (response.ok) {
				const data = await response.json();
				setCategories(data.docs || []);
			}
		} catch (error) {
			console.error("Error fetching categories:", error);
		}
	};

	const fetchPost = async () => {
		try {
			const response = await fetch(`/api/posts/${postId}`);
			if (response.ok) {
				const post = await response.json();
				reset({
					title: post.title,
					slug: post.slug,
					content: post.content || "",
					excerpt: post.excerpt || "",
					status: post.status,
					category: post.category?.id || "none",
					featuredImage: post.featuredImage?.url || "",
					seo: post.seo || {},
				});
			} else {
				toast.error("Failed to load post");
				router.push("/cms-admin/posts");
			}
		} catch (error) {
			console.error("Error fetching post:", error);
			toast.error("Failed to load post");
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: PostFormData) => {
		setSaving(true);
		try {
			const url = isNew ? "/api/posts" : `/api/posts/${postId}`;
			const method = isNew ? "POST" : "PATCH";

			// Convert "none" category back to undefined for API
			const submitData = {
				...data,
				category: data.category === "none" ? undefined : data.category,
			};

			const response = await axios({
				url,
				method,
				headers: {
					"Content-Type": "application/json",
				},
				data: submitData,
			});

			if (response.status >= 200 && response.status < 300) {
				toast.success(isNew ? "Post created successfully" : "Post updated successfully");
				router.push("/cms-admin/posts");
			} else {
				toast.error("Failed to save post");
			}
		} catch (error) {
			console.error("Error saving post:", error);
			toast.error("Failed to save post");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/cms-admin/posts">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{isNew ? "Create Post" : "Edit Post"}</h1>
					<p className="text-muted-foreground">{isNew ? "Create a new blog post" : "Update your blog post"}</p>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Main Content */}
				<Card>
					<CardHeader>
						<CardTitle>Post Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input id="title" {...register("title")} placeholder="Enter post title" />
							{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="slug">Slug</Label>
							<Input id="slug" {...register("slug")} placeholder="post-url-slug" />
							{errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="excerpt">Excerpt</Label>
							<Textarea id="excerpt" {...register("excerpt")} placeholder="Brief description of the post" rows={3} />
						</div>

						<div className="space-y-2">
							<Label htmlFor="content">Content</Label>
							<Textarea
								id="content"
								{...register("content")}
								placeholder="Write your post content here..."
								rows={15}
								className="font-mono text-sm"
							/>
							{errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
						</div>
					</CardContent>
				</Card>

				{/* Sidebar Options */}
				<div className="grid gap-6 md:grid-cols-3">
					<div className="md:col-span-2 space-y-6">
						{/* SEO Settings */}
						<Card>
							<CardHeader>
								<CardTitle>SEO Settings</CardTitle>
								<CardDescription>Optimize your post for search engines</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="seo.title">SEO Title</Label>
									<Input id="seo.title" {...register("seo.title")} placeholder="SEO optimized title" />
								</div>

								<div className="space-y-2">
									<Label htmlFor="seo.description">Meta Description</Label>
									<Textarea
										id="seo.description"
										{...register("seo.description")}
										placeholder="Brief description for search results"
										rows={3}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="seo.keywords">Keywords</Label>
									<Input id="seo.keywords" {...register("seo.keywords")} placeholder="keyword1, keyword2, keyword3" />
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-6">
						{/* Publish Settings */}
						<Card>
							<CardHeader>
								<CardTitle>Publish Settings</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between">
									<Label htmlFor="status">Status</Label>
									<Select value={watchStatus} onValueChange={(value: any) => setValue("status", value)}>
										<SelectTrigger className="w-[120px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="published">Published</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="category">Category</Label>
									<Select value={watch("category")} onValueChange={(value) => setValue("category", value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No category</SelectItem>
											{categories.map((category) => (
												<SelectItem key={category.id} value={category.id}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="featuredImage">Featured Image URL</Label>
									<Input id="featuredImage" {...register("featuredImage")} placeholder="https://example.com/image.jpg" />
								</div>
							</CardContent>
						</Card>

						{/* Actions */}
						<Card>
							<CardContent className="pt-6">
								<div className="flex flex-col gap-2">
									<Button type="submit" disabled={saving}>
										{saving ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="mr-2 h-4 w-4" />
												{isNew ? "Create Post" : "Update Post"}
											</>
										)}
									</Button>
									<Button variant="outline" asChild>
										<Link href="/cms-admin/posts">Cancel</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</form>
		</div>
	);
}
