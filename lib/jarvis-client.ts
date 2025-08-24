// JARVIS API Client
// Comprehensive client for JARVIS API and WebSocket communication

import {
	JarvisStatusResponse,
	JarvisMessageRequest,
	JarvisMessageResponse,
	JarvisApiError,
	JarvisWebSocketMessage,
	JarvisWebSocketMessageType,
	JarvisConfig,
} from "@/types/jarvis";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: JarvisConfig = {
	websocket: {
		url: process.env.NEXT_PUBLIC_JARVIS_WS_URL || "ws://localhost:8765",
		reconnectAttempts: 10,
		reconnectInterval: 5000,
		heartbeatInterval: 30000,
		timeout: 30000,
	},
	features: {
		enableVoice: true,
		enableStreaming: true,
		enableConfidenceScoring: true,
		enableMcpIntegration: true,
		enableAudioLevels: true,
	},
	ui: {
		theme: "auto",
		showTimestamps: true,
		showMetadata: true,
		enableAnimations: true,
		maxMessages: 100,
	},
};

// ============================================================================
// JARVIS API Client Class
// ============================================================================

export class JarvisApiClient {
	private config: JarvisConfig;
	private baseUrl: string;

	constructor(config?: Partial<JarvisConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.baseUrl = process.env.NEXT_PUBLIC_JARVIS_API_URL || "/api/jarvis";
	}

	/**
	 * Get JARVIS status and health information
	 */
	async getStatus(): Promise<JarvisStatusResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/status`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new JarvisApiError(`Failed to get JARVIS status: ${response.statusText}`, response.status, "STATUS_ERROR");
			}

			const data = await response.json();
			return data;
		} catch (error) {
			if (error instanceof JarvisApiError) {
				throw error;
			}

			// Handle network errors
			if (error instanceof TypeError && error.message === "Failed to fetch") {
				throw new JarvisApiError("Unable to connect to JARVIS service. Please ensure the service is running.", 503, "SERVICE_UNAVAILABLE");
			}

			throw new JarvisApiError(error instanceof Error ? error.message : "Unknown error occurred", 500, "UNKNOWN_ERROR", error);
		}
	}

	/**
	 * Send a message to JARVIS (fallback for non-WebSocket scenarios)
	 */
	async sendMessage(request: JarvisMessageRequest): Promise<JarvisMessageResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new JarvisApiError(
					errorData.error || `Request failed: ${response.statusText}`,
					response.status,
					errorData.code || "REQUEST_FAILED",
					errorData
				);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			if (error instanceof JarvisApiError) {
				throw error;
			}

			if (error instanceof TypeError && error.message === "Failed to fetch") {
				throw new JarvisApiError("Unable to send message to JARVIS. Please check your connection.", 503, "SERVICE_UNAVAILABLE");
			}

			throw new JarvisApiError(error instanceof Error ? error.message : "Unknown error occurred", 500, "UNKNOWN_ERROR", error);
		}
	}

	/**
	 * Get WebSocket URL for real-time communication
	 */
	getWebSocketUrl(): string {
		return this.config.websocket.url;
	}

	/**
	 * Get configuration
	 */
	getConfig(): JarvisConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration
	 */
	updateConfig(updates: Partial<JarvisConfig>): void {
		this.config = { ...this.config, ...updates };
	}
}

// ============================================================================
// WebSocket Message Utilities
// ============================================================================

export class JarvisWebSocketUtils {
	/**
	 * Create a formatted WebSocket message
	 */
	static createMessage(type: JarvisWebSocketMessageType, data: any, id?: string): JarvisWebSocketMessage {
		return {
			type,
			data,
			timestamp: Date.now(),
			id: id || this.generateId(),
		};
	}

	/**
	 * Parse incoming WebSocket message
	 */
	static parseMessage(rawMessage: string | any): JarvisWebSocketMessage | null {
		try {
			const message = typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;

			if (!message.type || !message.data || !message.timestamp) {
				console.warn("Invalid JARVIS WebSocket message format:", message);
				return null;
			}

			return message as JarvisWebSocketMessage;
		} catch (error) {
			console.error("Failed to parse JARVIS WebSocket message:", error);
			return null;
		}
	}

	/**
	 * Validate message type
	 */
	static isValidMessageType(type: string): type is JarvisWebSocketMessageType {
		const validTypes: JarvisWebSocketMessageType[] = [
			"jarvis_response",
			"jarvis_response_stream",
			"jarvis_response_end",
			"status_update",
			"wake_word_detected",
			"audio_level",
			"error",
			"heartbeat",
			"user_message",
			"system_notification",
			"start_meeting_mode",
			"stop_meeting_mode",
			"meeting_transcription",
			"listening_mode_changed",
		];

		return validTypes.includes(type as JarvisWebSocketMessageType);
	}

	/**
	 * Generate unique message ID
	 */
	static generateId(): string {
		return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Create user message for WebSocket
	 */
	static createUserMessage(message: string, metadata?: Record<string, any>): JarvisWebSocketMessage {
		return this.createMessage("user_message", {
			message,
			metadata: {
				timestamp: Date.now(),
				source: "text",
				...metadata,
			},
		});
	}

	/**
	 * Create heartbeat message
	 */
	static createHeartbeat(): JarvisWebSocketMessage {
		return this.createMessage("heartbeat", {
			timestamp: Date.now(),
			client: "react-frontend",
		});
	}
}

// ============================================================================
// Connection Manager
// ============================================================================

export class JarvisConnectionManager {
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number;
	private reconnectInterval: number;
	private heartbeatInterval: number;
	private heartbeatTimer: NodeJS.Timeout | null = null;
	private reconnectTimer: NodeJS.Timeout | null = null;

	constructor(config: JarvisConfig["websocket"]) {
		this.maxReconnectAttempts = config.reconnectAttempts;
		this.reconnectInterval = config.reconnectInterval;
		this.heartbeatInterval = config.heartbeatInterval;
	}

	/**
	 * Calculate reconnect delay with exponential backoff
	 */
	getReconnectDelay(): number {
		const baseDelay = this.reconnectInterval;
		const exponentialDelay = Math.min(
			Math.pow(2, this.reconnectAttempts) * 1000,
			30000 // Cap at 30 seconds
		);
		return Math.max(baseDelay, exponentialDelay);
	}

	/**
	 * Should attempt reconnection
	 */
	shouldReconnect(): boolean {
		return this.reconnectAttempts < this.maxReconnectAttempts;
	}

	/**
	 * Increment reconnect attempts
	 */
	incrementReconnectAttempts(): void {
		this.reconnectAttempts++;
	}

	/**
	 * Reset reconnect attempts
	 */
	resetReconnectAttempts(): void {
		this.reconnectAttempts = 0;
	}

	/**
	 * Start heartbeat
	 */
	startHeartbeat(sendMessage: (message: JarvisWebSocketMessage) => void): void {
		this.stopHeartbeat();

		this.heartbeatTimer = setInterval(() => {
			sendMessage(JarvisWebSocketUtils.createHeartbeat());
		}, this.heartbeatInterval);
	}

	/**
	 * Stop heartbeat
	 */
	stopHeartbeat(): void {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	/**
	 * Schedule reconnection
	 */
	scheduleReconnect(reconnectFn: () => void): void {
		this.clearReconnectTimer();

		const delay = this.getReconnectDelay();
		console.log(`Scheduling JARVIS reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

		this.reconnectTimer = setTimeout(() => {
			if (this.shouldReconnect()) {
				this.incrementReconnectAttempts();
				reconnectFn();
			}
		}, delay);
	}

	/**
	 * Clear reconnect timer
	 */
	clearReconnectTimer(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}

	/**
	 * Cleanup all timers
	 */
	cleanup(): void {
		this.stopHeartbeat();
		this.clearReconnectTimer();
	}
}

// ============================================================================
// Message Queue Manager
// ============================================================================

export class JarvisMessageQueue {
	private queue: JarvisWebSocketMessage[] = [];
	private isProcessing: boolean = false;
	private maxQueueSize: number = 50;

	/**
	 * Add message to queue
	 */
	enqueue(message: JarvisWebSocketMessage): boolean {
		if (this.queue.length >= this.maxQueueSize) {
			console.warn("JARVIS message queue is full, dropping oldest message");
			this.queue.shift();
		}

		this.queue.push(message);
		return true;
	}

	/**
	 * Get next message from queue
	 */
	dequeue(): JarvisWebSocketMessage | null {
		return this.queue.shift() || null;
	}

	/**
	 * Process queue with WebSocket
	 */
	async processQueue(sendMessage: (message: string) => void): Promise<void> {
		if (this.isProcessing || this.queue.length === 0) {
			return;
		}

		this.isProcessing = true;

		try {
			while (this.queue.length > 0) {
				const message = this.dequeue();
				if (message) {
					sendMessage(JSON.stringify(message));
					// Small delay to prevent overwhelming the WebSocket
					await new Promise((resolve) => setTimeout(resolve, 10));
				}
			}
		} catch (error) {
			console.error("Error processing JARVIS message queue:", error);
		} finally {
			this.isProcessing = false;
		}
	}

	/**
	 * Clear queue
	 */
	clear(): void {
		this.queue = [];
		this.isProcessing = false;
	}

	/**
	 * Get queue status
	 */
	getStatus(): { size: number; isProcessing: boolean } {
		return {
			size: this.queue.length,
			isProcessing: this.isProcessing,
		};
	}
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const jarvisApiClient = new JarvisApiClient();

// ============================================================================
// Exports
// ============================================================================

export { JarvisApiError, DEFAULT_CONFIG as JARVIS_DEFAULT_CONFIG };

export default jarvisApiClient;
