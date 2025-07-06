import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../payload.config.js";

export async function GET() {
  try {
    const payload = await getPayload({ config });
    
    const result = await payload.find({
      collection: "media",
      limit: 100,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Media GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const result = await payload.create({
      collection: "media",
      data: {
        alt: formData.get('alt') as string || file.name,
      },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Media POST error:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}