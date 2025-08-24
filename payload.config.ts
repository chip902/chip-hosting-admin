import path from "path";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { buildConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";
// Temporarily inline Comments to avoid ESM issues

console.log('[PAYLOAD CONFIG] Loading config...');
console.log('[PAYLOAD CONFIG] DATABASE_URI:', process.env.DATABASE_URI || 'NOT SET');
console.log('[PAYLOAD CONFIG] PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'SET' : 'NOT SET');

const config = buildConfig({
	admin: { 
		user: "users",
		autoLogin: false,
	},
	editor: lexicalEditor({}),
	collections: [
		{
			slug: "users",
			auth: true,
			fields: [
				{
					name: "email",
					type: "email",
					required: true,
					unique: true,
				},
			],
		},
		{
			slug: 'comments',
			admin: {
				useAsTitle: 'id',
				defaultColumns: ['post', 'authorName', 'isApproved', 'createdAt'],
			},
			fields: [
				{
					name: 'post',
					type: 'relationship',
					relationTo: 'posts',
					required: true,
				},
				{
					name: 'content',
					type: 'richText',
					required: true,
				},
				{
					name: 'author',
					type: 'relationship',
					relationTo: 'users',
					required: false,
				},
				{
					name: 'anonymousId',
					type: 'text',
					required: false,
				},
				{
					name: 'authorName',
					type: 'text',
					required: false,
				},
				{
					name: 'parentComment',
					type: 'relationship',
					relationTo: 'comments',
					required: false,
				},
				{
					name: 'votes',
					type: 'group',
					fields: [
						{
							name: 'upvotes',
							type: 'number',
							defaultValue: 0,
						},
						{
							name: 'downvotes',
							type: 'number',
							defaultValue: 0,
						},
						{
							name: 'score',
							type: 'number',
							defaultValue: 0,
						},
					],
				},
				{
					name: 'isApproved',
					type: 'checkbox',
					defaultValue: false,
				},
				{
					name: 'isSpam',
					type: 'checkbox',
					defaultValue: false,
				},
			],
		},
		{
			slug: "posts",
			admin: { useAsTitle: "title" },
			fields: [
				{ name: "title", type: "text", required: true },
				{ name: "slug", type: "text", required: true, unique: true },
				{
					name: "featuredImage",
					type: "relationship",
					relationTo: "media",
					admin: {
						description: "Choose a featured image for this post"
					}
				},
				{
					name: "excerpt",
					type: "richText",
					admin: {
						description: "Brief summary of the post (used for previews and SEO)"
					}
				},
				{
					name: "content",
					type: "richText",
					required: true,
					admin: {
						description: "Main content of the blog post"
					}
				},
				{
					name: "category",
					type: "relationship",
					relationTo: "categories",
					admin: {
						description: "Select a category for this post"
					}
				},
				{
					name: "tags",
					type: "text",
					hasMany: true,
					admin: {
						description: "Add tags to categorize your post (press Enter to add each tag)"
					}
				},
				{
					name: "author",
					type: "relationship",
					relationTo: "users",
					defaultValue: ({ user }) => user?.id,
					admin: {
						description: "Author of this post"
					}
				},
				{ name: "publishedAt", type: "date" },
				{ 
					name: "status", 
					type: "select", 
					options: ["draft", "published"], 
					defaultValue: "draft",
					admin: {
						description: "Post status - drafts are not visible on the website"
					}
				},
			],
		},
		{
			slug: "categories",
			admin: { useAsTitle: "name" },
			fields: [
				{ name: "name", type: "text", required: true },
				{ name: "slug", type: "text", required: true },
				{ name: "description", type: "textarea" },
			],
		},
		{
			slug: "media",
			upload: {
				staticDir: "media",
				imageSizes: [
					{
						name: "thumbnail",
						width: 400,
						height: 300,
						position: "centre",
					},
					{
						name: "card",
						width: 768,
						height: 1024,
						position: "centre",
					},
				],
				mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
			},
			fields: [
				{
					name: "alt",
					type: "text",
					required: true,
					admin: {
						description: "Alternative text for accessibility and SEO"
					}
				},
			],
		},
	],
	plugins: [
		seoPlugin({
			collections: ["posts"],
			uploadsCollection: "media",
			generateTitle: ({ doc }) => `${doc?.title || "Blog Post"}`,
			generateDescription: ({ doc }) => {
				// Try to get description from excerpt or content
				if (doc?.excerpt) {
					// If excerpt is rich text, extract plain text
					if (typeof doc.excerpt === 'object' && doc.excerpt.root) {
						// Extract text from Lexical structure
						const extractText = (node) => {
							if (node.text) return node.text;
							if (node.children) {
								return node.children.map(extractText).join('');
							}
							return '';
						};
						return extractText(doc.excerpt.root).substring(0, 160);
					}
					return typeof doc.excerpt === 'string' ? doc.excerpt.substring(0, 160) : '';
				}
				return `Read more about ${doc?.title || "this blog post"} on our website.`;
			}
		})
	],
	secret: process.env.PAYLOAD_SECRET || "your-secret-here",
	typescript: { outputFile: path.resolve(process.cwd(), "payload-types.ts") },
	db: mongooseAdapter({
		url: process.env.DATABASE_URI || "",
		connectOptions: {
			dbName: "chip-hosting-admin",
		},
	}),
});

console.log('[PAYLOAD CONFIG] Config created successfully');
export default config;