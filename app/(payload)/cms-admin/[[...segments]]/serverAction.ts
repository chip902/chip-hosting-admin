"use server";

/**
 * Server action for Payload CMS admin
 */
export async function serverAction({ name, args }: { name: string; args: Record<string, unknown> }): Promise<unknown> {
	try {
		console.log(`[Admin] Server action called:`, { name, args });

		// For now, return a simple response
		// In a real implementation, this would handle Payload operations
		return { success: true, name, args };
	} catch (error: any) {
		console.error("[Admin] Server action error:", error);
		return { error: error.message };
	}
}
