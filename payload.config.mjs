import path from "path";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { buildConfig } from "payload";

console.log('[PAYLOAD CONFIG] Loading config...');
console.log('[PAYLOAD CONFIG] DATABASE_URI:', process.env.DATABASE_URI || 'NOT SET');
console.log('[PAYLOAD CONFIG] PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'SET' : 'NOT SET');

const config = buildConfig({
	admin: { 
		user: "users",
		autoLogin: false,
	},
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
			slug: "posts",
			admin: { useAsTitle: "title" },
			fields: [
				{ name: "title", type: "text", required: true },
				{ name: "content", type: "textarea", required: true },
				{ name: "slug", type: "text", required: true },
				{ 
					name: "category",
					type: "relationship",
					relationTo: "categories",
				},
				{ name: "publishedAt", type: "date" },
				{ name: "status", type: "select", options: ["draft", "published"], defaultValue: "draft" },
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
			},
			fields: [
				{
					name: "alt",
					type: "text",
				},
			],
		},
	],
	plugins: [],
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
