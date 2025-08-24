// JARVIS Status API Route
// Provides health status and capabilities of JARVIS service

import { NextRequest, NextResponse } from "next/server";
import { JarvisStatusResponse } from "@/types/jarvis";

// Test WebSocket connection to JARVIS backend
async function testWebSocketConnection(wsUrl: string): Promise<boolean> {
	try {
		// Import WebSocket for server-side use
		const WebSocket = (await import("ws")).default;

		return new Promise((resolve) => {
			const ws = new WebSocket(wsUrl);
			let connected = false;

			const timeout = setTimeout(() => {
				if (!connected) {
					ws.terminate();
					resolve(false);
				}
			}, 3000); // 3 second timeout

			ws.on("open", () => {
				connected = true;
				clearTimeout(timeout);
				ws.close();
				resolve(true);
			});

			ws.on("error", () => {
				clearTimeout(timeout);
				resolve(false);
			});

			ws.on("close", () => {
				if (!connected) {
					clearTimeout(timeout);
					resolve(false);
				}
			});
		});
	} catch (error) {
		console.log("WebSocket test error:", error);
		return false;
	}
}

// Mock JARVIS service health check
async function checkJarvisHealth(): Promise<JarvisStatusResponse> {
	try {
		// In a real implementation, this would make HTTP requests to the JARVIS service
		// For now, we'll simulate the health check with a mock response

		const jarvisServiceUrl = process.env.JARVIS_SERVICE_URL || "http://localhost:8000";

		let isConnected = false;
		let jarvisStatus = null;
		let serviceHealth = {
			ollama: false,
			whisper: false,
			tts: false,
			vector_db: false,
			mcp_servers: false,
		};

		try {
			// For WebSocket-only JARVIS backend, test WebSocket connection instead of HTTP
			const wsUrl = jarvisServiceUrl.replace("http://", "ws://").replace("https://", "wss://") + "/ws";

			// Test WebSocket connection with a quick ping
			const wsConnected = await testWebSocketConnection(wsUrl);

			if (wsConnected) {
				isConnected = true;
				jarvisStatus = {
					listening: true,
					processing: false,
					model_loaded: true,
					audio_devices_ok: true,
					obsidian_connected: true,
					tts_available: true,
					capabilities: {
						voice_activation: true,
						text_input: true,
						enhanced_search: true,
						mcp_integration: true,
						confidence_scoring: true,
						audio_streaming: true,
						memory_persistence: true,
						web_search: true,
						document_search: true,
					},
				};
				serviceHealth = {
					ollama: true,
					whisper: true,
					tts: true,
					vector_db: true,
					mcp_servers: true,
				};
			}
		} catch (fetchError) {
			console.log("JARVIS service not available:", fetchError);
			// Fall back to offline status
			isConnected = false;
			jarvisStatus = {
				listening: false,
				processing: false,
				model_loaded: false,
				audio_devices_ok: false,
				obsidian_connected: false,
				tts_available: false,
				capabilities: {
					voice_activation: false,
					text_input: true, // Text input can work even if service is down
					enhanced_search: false,
					mcp_integration: false,
					confidence_scoring: false,
					audio_streaming: false,
					memory_persistence: false,
					web_search: false,
					document_search: false,
				},
			};
		}

		const healthStatus: JarvisStatusResponse = {
			health: {
				is_connected: isConnected,
				jarvis_status: jarvisStatus,
				status: isConnected ? "healthy" : "offline",
				service_health: serviceHealth,
			},
			metadata: {
				version: "2.0.0",
				uptime: Date.now() - process.uptime() * 1000,
				last_restart: new Date(Date.now() - process.uptime() * 1000).toISOString(),
			},
		};

		return healthStatus;
	} catch (error) {
		console.error("Error checking JARVIS health:", error);

		// Return offline status on error
		return {
			health: {
				is_connected: false,
				jarvis_status: {
					listening: false,
					processing: false,
					model_loaded: false,
					audio_devices_ok: false,
					obsidian_connected: false,
					tts_available: false,
					capabilities: {
						voice_activation: false,
						text_input: false,
						enhanced_search: false,
						mcp_integration: false,
						confidence_scoring: false,
						audio_streaming: false,
						memory_persistence: false,
						web_search: false,
						document_search: false,
					},
				},
				status: "offline",
				service_health: {
					ollama: false,
					whisper: false,
					tts: false,
					vector_db: false,
					mcp_servers: false,
				},
			},
			metadata: {
				version: "2.0.0",
				uptime: 0,
				last_restart: new Date().toISOString(),
			},
		};
	}
}

export async function GET(request: NextRequest) {
	try {
		const status = await checkJarvisHealth();

		return NextResponse.json(status, {
			status: 200,
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	} catch (error) {
		console.error("Error in JARVIS status endpoint:", error);

		return NextResponse.json(
			{
				error: "Failed to check JARVIS status",
				code: "STATUS_CHECK_ERROR",
				message: error instanceof Error ? error.message : "Unknown error",
				health: {
					is_connected: false,
					jarvis_status: null,
					status: "error",
					service_health: {
						ollama: false,
						whisper: false,
						tts: false,
						vector_db: false,
						mcp_servers: false,
					},
				},
			},
			{ status: 500 }
		);
	}
}

export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
