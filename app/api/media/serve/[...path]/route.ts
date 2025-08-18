import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../payload.config.mjs";
import path from "path";
import fs from "fs";

export async function GET(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	try {
		const filepath = params.path.join("/");
		const mediaPath = path.join(process.cwd(), "media", filepath);

		// Check if file exists
		if (!fs.existsSync(mediaPath)) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		// Get file stats
		const stats = fs.statSync(mediaPath);
		const fileSize = stats.size;

		// Determine content type
		const ext = path.extname(filepath).toLowerCase();
		const contentTypeMap: { [key: string]: string } = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
			'.svg': 'image/svg+xml',
			'.pdf': 'application/pdf',
			'.txt': 'text/plain',
		};

		const contentType = contentTypeMap[ext] || 'application/octet-stream';

		// Read and serve file
		const fileBuffer = fs.readFileSync(mediaPath);

		return new NextResponse(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileSize.toString(),
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	} catch (error) {
		console.error("Media serve error:", error);
		return NextResponse.json({ error: "Failed to serve media" }, { status: 500 });
	}
}
