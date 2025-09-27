import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from "@payloadcms/next/routes";
import type { NextRequest } from "next/server";
import config from "@/payload.config.ts";

const getHandler = REST_GET(config);
const postHandler = REST_POST(config);
const deleteHandler = REST_DELETE(config);
const patchHandler = REST_PATCH(config);

type PayloadContext = { params: Promise<{ payload?: string[] }> };

const mapContext = (context: PayloadContext) => ({
	params: context.params.then(({ payload }) => ({ slug: payload ?? [] })),
});

export function GET(request: NextRequest, context: PayloadContext) {
	return getHandler(request, mapContext(context));
}

export function POST(request: NextRequest, context: PayloadContext) {
	return postHandler(request, mapContext(context));
}

export function DELETE(request: NextRequest, context: PayloadContext) {
	return deleteHandler(request, mapContext(context));
}

export function PATCH(request: NextRequest, context: PayloadContext) {
	return patchHandler(request, mapContext(context));
}
