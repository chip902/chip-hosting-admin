# Marketing Site Integration Guide

## 🎯 Overview

This guide explains how to integrate your Payload CMS admin with your marketing site to display blog posts and content.

## 📡 API Endpoints Available

Your admin project exposes these API endpoints:

```
GET /api/posts           # Get all posts
GET /api/posts/:id       # Get specific post by ID
GET /api/categories      # Get all categories
GET /api/media           # Get media files
GET /api/users           # Get users
```

## 🔄 Integration Methods

### Method 1: Direct API Calls (Recommended)

#### In Your Marketing Site:

```javascript
// lib/api.js
const ADMIN_API_URL = process.env.ADMIN_API_URL || "http://localhost:3000/api";

// Fetch all published posts
export const getPosts = async () => {
	try {
		const response = await fetch(`${ADMIN_API_URL}/posts?where[status][equals]=published&sort=-publishedDate`);
		const data = await response.json();
		return data.docs || [];
	} catch (error) {
		console.error("Error fetching posts:", error);
		return [];
	}
};

// Fetch single post by slug
export const getPostBySlug = async (slug) => {
	try {
		const response = await fetch(`${ADMIN_API_URL}/posts?where[slug][equals]=${slug}&limit=1`);
		const data = await response.json();
		return data.docs?.[0] || null;
	} catch (error) {
		console.error("Error fetching post:", error);
		return null;
	}
};

// Fetch categories
export const getCategories = async () => {
	try {
		const response = await fetch(`${ADMIN_API_URL}/categories`);
		const data = await response.json();
		return data.docs || [];
	} catch (error) {
		console.error("Error fetching categories:", error);
		return [];
	}
};
```

#### Next.js Pages (Marketing Site):

```javascript
// pages/blog/index.js
import { getPosts } from "../../lib/api";

export default function Blog({ posts }) {
	return (
		<div>
			<h1>Blog</h1>
			{posts.map((post) => (
				<article key={post.id}>
					<h2>{post.title}</h2>
					<p>{post.excerpt}</p>
					<a href={`/blog/${post.slug}`}>Read More</a>
				</article>
			))}
		</div>
	);
}

export async function getStaticProps() {
	const posts = await getPosts();
	return {
		props: { posts },
		revalidate: 60, // Revalidate every 60 seconds
	};
}
```

```javascript
// pages/blog/[slug].js
import { getPostBySlug, getPosts } from "../../lib/api";

export default function Post({ post }) {
	if (!post) return <div>Post not found</div>;

	return (
		<article>
			<h1>{post.title}</h1>
			<p>
				By {post.author.email} on {new Date(post.publishedDate).toLocaleDateString()}
			</p>
			{post.featuredImage && <img src={`${process.env.ADMIN_API_URL}/media/${post.featuredImage.filename}`} alt={post.featuredImage.alt} />}
			<div dangerouslySetInnerHTML={{ __html: post.content }} />
		</article>
	);
}

export async function getStaticPaths() {
	const posts = await getPosts();
	const paths = posts.map((post) => ({
		params: { slug: post.slug },
	}));

	return {
		paths,
		fallback: "blocking",
	};
}

export async function getStaticProps({ params }) {
	const post = await getPostBySlug(params.slug);
	return {
		props: { post },
		revalidate: 60,
	};
}
```

### Method 2: Webhook Integration

#### In Your Admin Project (payload.config.ts):

```typescript
collections: [
	{
		slug: "posts",
		hooks: {
			afterChange: [
				({ doc, operation }) => {
					// Only trigger on published posts
					if (doc.status === "published") {
						// Trigger marketing site rebuild
						fetch(`${process.env.MARKETING_SITE_URL}/api/revalidate`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${process.env.REVALIDATE_TOKEN}`,
							},
							body: JSON.stringify({
								type: "post",
								slug: doc.slug,
								action: operation,
							}),
						}).catch((err) => console.error("Webhook error:", err));
					}
				},
			],
		},
		// ... rest of your posts config
	},
];
```

#### In Your Marketing Site:

```javascript
// pages/api/revalidate.js
export default async function handler(req, res) {
	// Check for secret to confirm this is a valid request
	if (req.headers.authorization !== `Bearer ${process.env.REVALIDATE_TOKEN}`) {
		return res.status(401).json({ message: "Invalid token" });
	}

	try {
		const { type, slug, action } = req.body;

		if (type === "post") {
			// Revalidate the specific post page
			await res.revalidate(`/blog/${slug}`);
			// Revalidate the blog index page
			await res.revalidate("/blog");
		}

		return res.json({ revalidated: true });
	} catch (err) {
		return res.status(500).send("Error revalidating");
	}
}
```

### Method 3: Shared Database (Advanced)

If both projects use the same MongoDB database:

```javascript
// In your marketing site
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.DATABASE_URI);

export const getPostsFromDB = async () => {
	await client.connect();
	const db = client.db();
	const posts = await db
		.collection("posts")
		.find({
			status: "published",
		})
		.sort({ publishedDate: -1 })
		.toArray();

	return posts;
};
```

## 🛠️ Environment Variables

### Admin Project (.env.local):

```
DATABASE_URI=mongodb://localhost:27017/your-database
PAYLOAD_SECRET=your-secret-key
MARKETING_SITE_URL=https://your-marketing-site.com
REVALIDATE_TOKEN=your-revalidate-token
```

### Marketing Site (.env.local):

```
ADMIN_API_URL=https://your-admin-domain.com/api
REVALIDATE_TOKEN=your-revalidate-token
```

## 🚀 Deployment Architecture

```
┌─────────────────┐    API Calls      ┌─────────────────┐
│  Marketing Site │ ────────────────> │  Admin Project  │
│  (Next.js)      │                   │  (Payload CMS)  │
│  Port: 3001     │                   │  Port: 3000     │
└─────────────────┘                   └─────────────────┘
         │                                       │
         │                                       │
         v                                       v
┌─────────────────┐                   ┌─────────────────┐
│   Vercel/       │                   │   Vercel/       │
│   Netlify       │                   │   Railway       │
│   (Frontend)    │                   │   (Backend)     │
└─────────────────┘                   └─────────────────┘
                                              │
                                              │
                                              v
                                    ┌─────────────────┐
                                    │    MongoDB      │
                                    │   (Database)    │
                                    └─────────────────┘
```

## 📝 Example Content Flow

1. **Create Content**: Writer creates a blog post in admin at `/admin/posts`
2. **Publish**: Status is changed to "published"
3. **Webhook** (optional): Admin triggers marketing site rebuild
4. **API Call**: Marketing site fetches content via `/api/posts`
5. **Display**: Content appears on marketing site at `/blog/post-slug`

## 🔧 Next Steps

1. **Update CORS**: Replace placeholder domains with your actual marketing site URL
2. **Set Environment Variables**: Configure both projects with correct URLs
3. **Test Integration**: Create a test post and verify it appears on marketing site
4. **Set Up Webhooks**: Implement real-time updates (optional)
5. **Deploy**: Deploy both projects with proper environment variables

This approach gives you a powerful headless CMS where content creators can work in a beautiful admin interface while your marketing site automatically displays the content!
