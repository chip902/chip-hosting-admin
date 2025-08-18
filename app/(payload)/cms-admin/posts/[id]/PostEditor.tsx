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
import { ArrowLeft, Save, Loader2, Upload, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import axios from "axios";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EnhancedTextEditor from "@/components/EnhancedTextEditor";

// Helper to create Lexical structure from text - preserving all line breaks
const createLexicalFromText = (text: string) => {
  if (!text || !text.trim()) {
    // Return minimal empty structure
    return {
      root: {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [],
          direction: null,
          format: '',
          indent: 0,
          version: 1
        }],
        direction: null,
        format: '',
        indent: 0,
        version: 1
      }
    }
  }
  
  // Split by single newlines to preserve all line breaks
  // Each line becomes its own paragraph to preserve formatting
  const lines = text.split('\n')
  const children: any[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip completely empty lines but preserve spacing
    if (line === '') {
      // Add empty paragraph to maintain spacing
      children.push({
        type: 'paragraph',
        children: [],
        direction: null,
        format: '',
        indent: 0,
        version: 1
      })
      continue
    }
    
    // Check if this is a heading
    if (line.startsWith('#')) {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        children.push({
          type: 'heading',
          children: [{
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: headingMatch[2],
            version: 1
          }],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
          tag: `h${level}`
        })
        continue
      }
    }
    
    // Regular text line - create paragraph
    children.push({
      type: 'paragraph',
      children: [{
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: line,
        version: 1
      }],
      direction: null,
      format: '',
      indent: 0,
      version: 1
    })
  }
  
  // If no children, create an empty paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      children: [],
      direction: null,
      format: '',
      indent: 0,
      version: 1
    })
  }
  
  return {
    root: {
      type: 'root',
      children: children,
      direction: null,
      format: '',
      indent: 0,
      version: 1
    }
  }
}

// Helper to extract text from rich text content while preserving all line breaks
const extractTextFromRichText = (richText: any): string => {
  if (!richText || typeof richText !== 'object') return ''
  
  console.log('Extracting from richText:', JSON.stringify(richText, null, 2))
  
  const extractText = (node: any): string => {
    console.log('Processing node:', node.type, node)
    
    if (node.text) return node.text
    
    if (node.type === 'heading' && node.children) {
      // For headings, add the appropriate number of # symbols
      const level = node.tag ? parseInt(node.tag.replace('h', '')) : 2
      const headingText = node.children.map((child: any) => extractText(child)).join('')
      const result = headingText ? '#'.repeat(level) + ' ' + headingText : ''
      console.log('Heading result:', result)
      return result
    }
    
    if (node.type === 'paragraph' && node.children) {
      // For paragraphs, extract text without adding extra newlines
      const paragraphText = node.children.map((child: any) => extractText(child)).join('')
      console.log('Paragraph result:', paragraphText.substring(0, 50) + '...')
      return paragraphText
    }
    
    if (node.type === 'linebreak') {
      return '\n'
    }
    
    if (node.children && Array.isArray(node.children)) {
      return node.children.map((child: any) => extractText(child)).join('')
    }
    
    return ''
  }
  
  if (richText.root && richText.root.children) {
    // Join children with single newlines to preserve line breaks
    const result = richText.root.children.map((child: any) => {
      const childText = extractText(child)
      return childText
    }).join('\n')
    
    console.log('Final extracted text:', result.substring(0, 200) + '...')
    return result.trim()
  }
  
  return ''
}

const postSchema = z.object({
	title: z.string().min(1, "Title is required"),
	slug: z.string().min(1, "Slug is required"),
	content: z.string().min(1, "Content is required"),
	excerpt: z.string().optional(),
	status: z.enum(["draft", "published"]),
	category: z.string().optional(),
	featuredImageId: z.string().optional(),
	tags: z.array(z.string()).optional(),
	seo: z
		.object({
			title: z.string().optional(),
			description: z.string().optional(),
			image: z.string().optional(),
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
	const [media, setMedia] = useState<any[]>([]);
	const [showMediaDialog, setShowMediaDialog] = useState(false);
	const [selectedImage, setSelectedImage] = useState<any>(null);
	const [uploadingImage, setUploadingImage] = useState(false);

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
			seo: {
				title: "",
				description: "",
				image: "none",
				keywords: ""
			},
		},
	});

	const watchTitle = watch("title");
	const watchStatus = watch("status");

	useEffect(() => {
		fetchCategories();
		fetchMedia();
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
			const response = await fetch("/api/categories?limit=100");
			if (response.ok) {
				const data = await response.json();
				setCategories(data.docs || []);
			}
		} catch (error) {
			console.error("Error fetching categories:", error);
		}
	};

	const fetchMedia = async () => {
		try {
			const response = await fetch("/api/media?limit=100");
			if (response.ok) {
				const data = await response.json();
				setMedia(data.docs || []);
			}
		} catch (error) {
			console.error("Error fetching media:", error);
		}
	};

	const fetchPost = async () => {
		try {
			const response = await fetch(`/api/posts/${postId}?depth=2`);
			if (response.ok) {
				const post = await response.json();
				reset({
					title: post.title,
					slug: post.slug,
					content: extractTextFromRichText(post.content) || "",
					excerpt: extractTextFromRichText(post.excerpt) || "",
					status: post.status,
					category: typeof post.category === 'object' && post.category ? post.category.id : "none",
					featuredImageId: typeof post.featuredImage === 'object' && post.featuredImage ? post.featuredImage.id : undefined,
					tags: post.tags || [],
					seo: {
						title: post.meta?.title || "",
						description: post.meta?.description || "",
						image: typeof post.meta?.image === 'object' && post.meta?.image ? post.meta.image.id : "none",
						keywords: "" // Keywords not stored in Payload meta
					},
				});
				// Set selected image if exists
				if (typeof post.featuredImage === 'object' && post.featuredImage) {
					setSelectedImage(post.featuredImage);
				}
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

	const handleImageUpload = async (file: File) => {
		setUploadingImage(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('alt', file.name);

			const response = await fetch('/api/media', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				const uploadedImage = await response.json();
				setSelectedImage(uploadedImage);
				setValue('featuredImageId', uploadedImage.id);
				toast.success('Image uploaded successfully');
				await fetchMedia(); // Refresh media list
			} else {
				toast.error('Failed to upload image');
			}
		} catch (error) {
			console.error('Error uploading image:', error);
			toast.error('Error uploading image');
		} finally {
			setUploadingImage(false);
		}
	};

	const handleSelectImage = (image: any) => {
		setSelectedImage(image);
		setValue('featuredImageId', image.id);
		setShowMediaDialog(false);
	};

	const handleRemoveImage = () => {
		setSelectedImage(null);
		setValue('featuredImageId', undefined);
	};

	const onSubmit = async (data: PostFormData) => {
		setSaving(true);
		try {
			const url = isNew ? "/api/posts" : `/api/posts/${postId}`;
			const method = isNew ? "POST" : "PATCH";

			// Convert content and excerpt to Lexical format
			const submitData: any = {
				...data,
				content: createLexicalFromText(data.content),
				excerpt: data.excerpt ? createLexicalFromText(data.excerpt) : undefined,
				category: data.category === "none" ? undefined : data.category,
				featuredImage: data.featuredImageId || undefined,
				tags: data.tags || [],
			};

			// Handle SEO meta fields
			if (data.seo) {
				const meta: any = {}
				if (data.seo.title?.trim()) {
					meta.title = data.seo.title.trim()
				}
				if (data.seo.description?.trim()) {
					meta.description = data.seo.description.trim()
				}
				if (data.seo.image && data.seo.image !== "none") {
					meta.image = data.seo.image
				}
				if (Object.keys(meta).length > 0) {
					submitData.meta = meta
				}
			}

			// Remove fields that shouldn't be sent
			delete submitData.seo;
			delete submitData.featuredImageId;

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
							<EnhancedTextEditor
								value={watch("excerpt") || ''}
								onChange={(value) => setValue("excerpt", value)}
								placeholder="Brief description of the post"
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="content">Content</Label>
							<EnhancedTextEditor
								value={watch("content")}
								onChange={(value) => setValue("content", value)}
								placeholder="Write your post content here..."
								className="min-h-[400px]"
								rows={15}
							/>
							{errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
							<p className="text-xs text-muted-foreground">
								Use the toolbar for formatting. Content will be converted to rich text in Payload CMS.
							</p>
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
									<Label htmlFor="seo.image">Meta Image</Label>
									<Select value={watch("seo.image")} onValueChange={(value) => setValue("seo.image", value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select meta image" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No meta image</SelectItem>
											{media.map((item) => (
												<SelectItem key={item.id} value={item.id}>
													{item.filename}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										Image for social media sharing and search results
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="seo.keywords">Keywords</Label>
									<Input id="seo.keywords" {...register("seo.keywords")} placeholder="keyword1, keyword2, keyword3" />
									<p className="text-xs text-muted-foreground">
										Keywords for reference (not sent to Payload)
									</p>
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
									<Label>Featured Image</Label>
									{selectedImage ? (
										<div className="relative border rounded-lg p-2">
											<img
												src={selectedImage.url || `/api/media/${selectedImage.id}`}
												alt={selectedImage.alt || 'Featured image'}
												className="w-full h-32 object-cover rounded"
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute top-1 right-1"
												onClick={handleRemoveImage}
											>
												<X className="h-4 w-4" />
											</Button>
											<p className="text-xs text-muted-foreground mt-1">{selectedImage.filename}</p>
										</div>
									) : (
										<div className="space-y-2">
											<Button
												type="button"
												variant="outline"
												className="w-full"
												onClick={() => setShowMediaDialog(true)}
											>
												<ImageIcon className="mr-2 h-4 w-4" />
												Select from Media Library
											</Button>
											<div className="relative">
												<Input
													type="file"
													accept="image/*"
													className="sr-only"
													id="image-upload"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) {
															handleImageUpload(file);
														}
													}}
												/>
												<Label
													htmlFor="image-upload"
													className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
												>
													<Upload className="mr-2 h-4 w-4" />
													Upload New Image
												</Label>
											</div>
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="tags">Tags</Label>
									<Input
										id="tags"
										value={(watch('tags') || []).join(', ')}
										onChange={(e) => setValue('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
										placeholder="tag1, tag2, tag3"
									/>
									<p className="text-xs text-muted-foreground">
										Enter tags separated by commas.
									</p>
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

			{/* Media Selection Dialog */}
			<Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
				<DialogContent className="max-w-4xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle>Select Featured Image</DialogTitle>
						<DialogDescription>
							Choose an image from your media library or upload a new one
						</DialogDescription>
					</DialogHeader>
					<div className="overflow-y-auto">
						<div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-4">
							{media.map((item) => (
								<div
									key={item.id}
									className="relative group cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
									onClick={() => handleSelectImage(item)}
								>
									<img
										src={item.url || `/api/media/${item.id}`}
										alt={item.alt || item.filename}
										className="w-full h-32 object-cover"
									/>
									<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
										<Button
											type="button"
											variant="secondary"
											size="sm"
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										>
											Select
										</Button>
									</div>
									<p className="text-xs p-2 truncate">{item.filename}</p>
								</div>
							))}
						</div>
						{media.length === 0 && (
							<div className="text-center py-8 text-muted-foreground">
								No images found. Upload some images to your media library first.
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
