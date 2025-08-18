import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest, context: { params: Promise<{ filename: string }> }) {
	try {
		const params = await context.params;
		console.log(`[MEDIA FILE] Serving file: ${params.filename}`);

		const filename = params.filename;
		const mediaPath = path.join(process.cwd(), "media", filename);

		// Check if file exists
		if (!fs.existsSync(mediaPath)) {
			console.error(`[MEDIA FILE] File not found: ${mediaPath}`);
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		// Get file stats
		const stats = fs.statSync(mediaPath);
		const fileSize = stats.size;

		// Determine content type
		const ext = path.extname(filename).toLowerCase();
		const contentTypeMap: { [key: string]: string } = {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".gif": "image/gif",
			".webp": "image/webp",
			".svg": "image/svg+xml",
			".pdf": "application/pdf",
			".txt": "text/plain",
		};

		const contentType = contentTypeMap[ext] || "application/octet-stream";

		// Read and serve file
		const fileBuffer = fs.readFileSync(mediaPath);

		console.log(`[MEDIA FILE] Successfully served: ${filename} (${fileSize} bytes)`);

		return new NextResponse(fileBuffer, {
			headers: {
				"Content-Type": contentType,
				"Content-Length": fileSize.toString(),
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error) {
		console.error(`[MEDIA FILE] Error serving file:`, error);
		return NextResponse.json({ error: "Failed to serve media file" }, { status: 500 });
	}
}
