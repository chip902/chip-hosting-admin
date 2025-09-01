"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { jarvisApiClient, JarvisApiError, JarvisWebSocketUtils, JarvisConnectionManager, JarvisMessageQueue } from "@/lib/jarvis-client";
import type {
	JarvisStatusResponse,
	JarvisConversationTurn,
	JarvisCapabilities,
	UseJarvisReturn,
	JarvisMessageResponse,
	StreamingMessage,
	JarvisWebSocketMessage,
	AudioLevels,
	VoiceActivation,
	ConfidenceBreakdown,
	SearchSource,
} from "@/types/jarvis";

// Extend the external return type locally to include sendCustomMessage
export type UseJarvisReturnExtended = UseJarvisReturn & {
	sendCustomMessage: (type: string, data?: any) => void;
};

// Source attribution utilities
export const getSourceIcon = (source: SearchSource): string => {
	switch (source) {
		case "documents":
			return "📄";
		case "crawled_pages":
			return "🌐";
		case "web_search":
			return "🔍";
		case "memory":
			return "🧠";
		case "tools":
			return "🔧";
		default:
			return "📝";
	}
};

export const getSourceLabel = (source: SearchSource): string => {
	switch (source) {
		case "documents":
			return "Documents";
		case "crawled_pages":
			return "Pages";
		case "web_search":
			return "Web Search";
		case "memory":
			return "Memory";
		case "tools":
			return "Tools";
		default:
			return "Unknown";
	}
};

export const getConfidenceColor = (confidence: number): string => {
	if (confidence >= 90) return "text-green-600";
	if (confidence >= 80) return "text-blue-600";
	if (confidence >= 60) return "text-yellow-600";
	return "text-red-600";
};

export const getConfidenceBadgeColor = (confidence: number): string => {
	if (confidence >= 90) return "bg-green-100 text-green-800";
	if (confidence >= 80) return "bg-blue-100 text-blue-800";
	if (confidence >= 60) return "bg-yellow-100 text-yellow-800";
	return "bg-red-100 text-red-800";
};

export function useJarvis(): UseJarvisReturnExtended {
	// Core state
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<JarvisStatusResponse | null>(null);
	const [capabilities, setCapabilities] = useState<JarvisCapabilities | null>(null);

	// Streaming and real-time state
	const [messages, setMessages] = useState<StreamingMessage[]>([]);
	// Removed streamingResponses to prevent infinite loops
	const [activeStreams, setActiveStreams] = useState<Set<string>>(new Set());
	const [audioLevels, setAudioLevels] = useState<AudioLevels | null>(null);

	// Meeting mode state
	const [isMeetingMode, setIsMeetingMode] = useState<boolean>(false);
	const [meetingStartTime, setMeetingStartTime] = useState<number | null>(null);
	const [lastVoiceActivation, setLastVoiceActivation] = useState<VoiceActivation | null>(null);

	// Enhanced metrics
	const [confidence, setConfidence] = useState<number>(0);
	const [searchSources, setSearchSources] = useState<string[]>([]);
	const [mcpEnhanced, setMcpEnhanced] = useState<boolean>(false);

	// Legacy conversation support (for backward compatibility)
	const [conversations, setConversations] = useState<JarvisConversationTurn[]>([]);

	// Refs for cleanup and management
	const isMounted = useRef(true);
	const connectionManager = useRef(new JarvisConnectionManager(jarvisApiClient.getConfig().websocket));
	const messageQueue = useRef(new JarvisMessageQueue());
	const lastMessageRef = useRef<string>("");
	// Track which response_ids are using explicit stream events to avoid double-processing
	const streamModeRef = useRef<Map<string, "explicit" | "implicit">>(new Map());
	// Track accumulated content per response to detect duplicates
	const accumulatedContentRef = useRef<Map<string, string>>(new Map());
	// Removed complex repetition tracking for better performance
	// Track finalized response IDs to prevent duplicate final messages
	const finalizedResponsesRef = useRef<Set<string>>(new Set());
	// Track processed messages to prevent infinite loops
	const processedMessagesRef = useRef<Set<string>>(new Set());

	// WebSocket configuration
	const socketUrl = jarvisApiClient.getWebSocketUrl();
	const shouldConnect = true;

	// (WebSocket setup moved below handleWebSocketMessage)

	// Handle streaming message tokens
	const handleStreamingMessage = useCallback((message: JarvisWebSocketMessage) => {
		const { response_id, token, stream_started } = message.data;

		// Prevent processing the same message multiple times
		const messageKey = `${response_id}-${stream_started ? 'start' : token}`;
		if (processedMessagesRef.current.has(messageKey)) {
			console.log(`[JARVIS] Skipping duplicate message: ${messageKey}`);
			return;
		}
		processedMessagesRef.current.add(messageKey);

		if (stream_started) {
			// Mark this response_id as using explicit streaming events
			streamModeRef.current.set(response_id, "explicit");
			// Clear any previous accumulated content for this response
			accumulatedContentRef.current.set(response_id, "");

			// Start new streaming response
			setActiveStreams((prev) => new Set([...prev, response_id]));

			// Create initial streaming message
			const streamingMessage: StreamingMessage = {
				id: `stream-${response_id}`,
				type: "assistant",
				content: "",
				timestamp: Date.now(),
				isStreaming: true,
				responseId: response_id,
			};

			setMessages((prev) => [...prev, streamingMessage]);
			console.log(`[JARVIS] Stream started for response ${response_id}`);
		} else if (token && response_id) {
			// Simple duplicate prevention - just check if we already have this exact content
			const currentContent = accumulatedContentRef.current.get(response_id) || "";
			const newContent = currentContent + token;

			// Update accumulated content
			accumulatedContentRef.current.set(response_id, newContent);

			// Use a ref-based update to avoid triggering re-renders during streaming
			setMessages((prev) => {
				const idx = prev.findIndex((m) => m.responseId === response_id);
				if (idx !== -1) {
					// Only update if content actually changed to prevent unnecessary re-renders
					if (prev[idx].content === newContent) {
						return prev; // No change, return same array reference
					}
					
					// Update existing message
					const updated = [...prev];
					const msg = updated[idx];
					updated[idx] = {
						...msg,
						content: newContent,
						isStreaming: !message.data.is_complete, // Stop streaming if complete
					};
					return updated;
				} else {
					// Create new streaming message if none exists
					if (!streamModeRef.current.has(response_id)) {
						streamModeRef.current.set(response_id, "implicit");
					}

					const newMsg: StreamingMessage = {
						id: `stream-${response_id}`,
						type: "assistant",
						content: newContent,
						timestamp: Date.now(),
						isStreaming: !message.data.is_complete,
						responseId: response_id,
					};
					console.log(`[JARVIS] Created new streaming message for response ${response_id}`);
					return [...prev, newMsg];
				}
			});

			// Handle stream completion
			if (message.data.is_complete) {
				console.log(`[JARVIS] ✅ Token marked as complete, finalizing stream for ${response_id}`);

				// Clean up immediately since this is the final token
				setActiveStreams((prev) => {
					const newSet = new Set(prev);
					newSet.delete(response_id);
					return newSet;
				});

				finalizedResponsesRef.current.add(response_id);
				streamModeRef.current.delete(response_id);
				accumulatedContentRef.current.delete(response_id);

				// Clean up message tracking
				setTimeout(() => {
					finalizedResponsesRef.current.delete(response_id);
					// Clear processed messages for this response to allow future interactions
					const keysToDelete = Array.from(processedMessagesRef.current).filter(key => key.startsWith(`${response_id}-`));
					keysToDelete.forEach(key => processedMessagesRef.current.delete(key));
				}, 2000);
			} else {
				// Make sure stream is marked as active for non-complete tokens
				setActiveStreams((prev) => new Set([...prev, response_id]));
			}
		}
	}, []);

	// Handle end of streaming - but don't finalize immediately since tokens may come after
	const handleStreamEnd = useCallback((message: JarvisWebSocketMessage) => {
		const { response_id, final_response, metadata } = message.data;

		console.log(`[JARVIS] 🔚 Received stream end for response ${response_id}, but keeping stream active for post-end tokens`);

		// Store the final response and metadata for later use, but don't close the stream yet
		const finalResponseData = {
			final_response,
			metadata,
			timestamp: Date.now(),
		};

		// Store in a ref for when we actually finalize
		if (!finalizedResponsesRef.current.has(response_id)) {
			accumulatedContentRef.current.set(response_id + "_final", JSON.stringify(finalResponseData));
		}

		// Update confidence and sources from metadata immediately
		if (metadata) {
			if (metadata.confidence !== undefined) {
				setConfidence(metadata.confidence);
			}
			if (metadata.search_sources) {
				setSearchSources(metadata.search_sources);
			}
			if (metadata.mcp_enhanced !== undefined) {
				setMcpEnhanced(metadata.mcp_enhanced);
			}
		}

		// Set a timer to finalize streams that don't get completed naturally
		setTimeout(() => {
			if (!finalizedResponsesRef.current.has(response_id)) {
				console.log(`[JARVIS] 🕰️ Timeout reached, finalizing stream for ${response_id}`);

				setActiveStreams((prev) => {
					const newSet = new Set(prev);
					newSet.delete(response_id);
					return newSet;
				});

				setMessages((prev) => {
					const idx = prev.findIndex((m) => m.responseId === response_id);
					if (idx !== -1) {
						const updated = [...prev];
						const msg = updated[idx];
						updated[idx] = {
							...msg,
							content: finalResponseData.final_response || msg.content,
							isStreaming: false,
							isComplete: true,
							metadata: {
								...msg.metadata,
								...finalResponseData.metadata,
								final_response: true,
							},
						};
						return updated;
					}
					return prev;
				});

				finalizedResponsesRef.current.add(response_id);
				streamModeRef.current.delete(response_id);
				accumulatedContentRef.current.delete(response_id);
				accumulatedContentRef.current.delete(response_id + "_final");
			}
		}, 2000); // Wait 2 seconds for any delayed tokens
	}, []);

	// Simplified cleanup - remove the separate finalizeStream function

	// Handle complete (non-streaming) response
	const handleCompleteResponse = useCallback((message: JarvisWebSocketMessage) => {
		const { response, metadata, response_id, final_response } = message.data || {};

		if (response_id) {
			// Check if this response has already been finalized
			if (finalizedResponsesRef.current.has(response_id)) {
				console.log(`[JARVIS] Skipping duplicate complete response for already finalized response ${response_id}`);
				return;
			}

			// Mark this response as finalized
			finalizedResponsesRef.current.add(response_id);

			// Treat as end-of-stream for known response_id, update existing message
			setActiveStreams((prev) => {
				const newSet = new Set(prev);
				newSet.delete(response_id);
				return newSet;
			});
			// Streaming responses state removed to prevent infinite loops
			streamModeRef.current.delete(response_id);
			accumulatedContentRef.current.delete(response_id);

			setMessages((prev) => {
				const idx = prev.findIndex((m) => m.responseId === response_id);
				if (idx !== -1) {
					const updated = [...prev];
					const msg = updated[idx];
					updated[idx] = {
						...msg,
						content: final_response || response || msg.content || "",
						isStreaming: false,
						isComplete: true,
						metadata: {
							...msg.metadata,
							...metadata,
							final_response: true,
						},
					};
					return updated;
				}
				// No existing message, create a new complete one
				const newMsg: StreamingMessage = {
					id: `stream-${response_id}`,
					type: "assistant",
					content: final_response || response || "",
					timestamp: Date.now(),
					isStreaming: false,
					isComplete: true,
					responseId: response_id,
					metadata: {
						...metadata,
						final_response: true,
					},
				};
				return [...prev, newMsg];
			});
		} else {
			// No response_id: append as a standalone complete message
			const completeMessage: StreamingMessage = {
				id: `complete-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
				type: "assistant",
				content: response,
				timestamp: Date.now(),
				isStreaming: false,
				isComplete: true,
				metadata,
			};

			setMessages((prev) => [...prev, completeMessage]);
		}

		// Update metrics
		if (metadata) {
			if (metadata.confidence !== undefined) {
				setConfidence(metadata.confidence);
			}
			if (metadata.search_sources) {
				setSearchSources(metadata.search_sources);
			}
			if (metadata.mcp_enhanced !== undefined) {
				setMcpEnhanced(metadata.mcp_enhanced);
			}
		}
	}, []);

	// Handle status updates
	const handleStatusUpdate = useCallback((message: JarvisWebSocketMessage) => {
		const statusData = message.data;
		setStatus(statusData);

		if (statusData.health?.jarvis_status?.capabilities) {
			setCapabilities(statusData.health.jarvis_status.capabilities);
		}
	}, []);

	// Handle audio level updates
	const handleAudioLevel = useCallback((message: JarvisWebSocketMessage) => {
		const audioData = message.data;
		setAudioLevels({
			primary: audioData.primary || 0,
			system: audioData.system || 0,
			microphone: audioData.microphone,
			speaker: audioData.speaker,
			timestamp: Date.now(),
		});
	}, []);

	// Handle voice activation
	const handleVoiceActivation = useCallback((message: JarvisWebSocketMessage) => {
		const voiceData = message.data;
		setLastVoiceActivation({
			wake_word_detected: true,
			confidence: voiceData.confidence || 1.0,
			timestamp: Date.now(),
			wake_word: voiceData.wake_word || "jarvis",
		});
	}, []);

	// Handle error messages
	const handleErrorMessage = useCallback((message: JarvisWebSocketMessage) => {
		const errorData = message.data;
		setError(errorData.message || "Unknown WebSocket error");
		// Clear all streaming state so UI input can re-enable
		setActiveStreams(new Set());
		streamModeRef.current.clear();
		accumulatedContentRef.current.clear();
		finalizedResponsesRef.current.clear();
		console.error(`[JARVIS] Error: ${errorData.message || "Unknown WebSocket error"}`);
	}, []);

	// Handle listening mode changes
	const handleListeningModeChange = useCallback(
		(message: JarvisWebSocketMessage) => {
			const { mode, status, title } = message.data;
			console.log(`Listening mode changed: ${mode} (${status})`);
			if (title) console.log(`Meeting title: ${title}`);

			// Update meeting mode state based on backend confirmation
			if (mode === "meeting") {
				if (status === "started") {
					setIsMeetingMode(true);
					setMeetingStartTime(Date.now());
					console.log("Meeting mode activated");
				}
			} else if (mode === "wake_word" || mode === "passive") {
				if (isMeetingMode) {
					setIsMeetingMode(false);
					setMeetingStartTime(null);
					console.log("Meeting mode deactivated");
				}
			}
		},
		[isMeetingMode]
	);

	// Handle meeting transcription messages
	const handleMeetingTranscription = useCallback((message: JarvisWebSocketMessage) => {
		const { text, timestamp, is_meeting } = message.data;
		console.log(`Meeting transcription: ${text}`);

		// You could add this to a dedicated meeting log state if needed
		// For now, this is mainly for debugging
	}, []);

	// Handle incoming WebSocket messages
	const handleWebSocketMessage = useCallback(
		(event: MessageEvent) => {
			if (!isMounted.current) return;

			try {
				const message = JarvisWebSocketUtils.parseMessage(event.data);
				if (!message) return;

				switch (message.type) {
					case "jarvis_response_stream":
						// Mark explicit streaming for this response_id
						if (message.data?.response_id) {
							const existingMode = streamModeRef.current.get(message.data.response_id);
							if (!existingMode) {
								streamModeRef.current.set(message.data.response_id, "explicit");
							}
						}
						handleStreamingMessage(message);
						break;
					case "jarvis_response_end":
						handleStreamEnd(message);
						break;
					case "jarvis_response": {
						// Some backends may emit streaming tokens under 'jarvis_response'
						const d = message.data || {};
						const rid = d.response_id;

						// Log the incoming jarvis_response for debugging
						console.log(
							`[JARVIS] Received jarvis_response - response_id: ${rid}, has final_response: ${!!d.final_response}, has response: ${!!d.response}, has token: ${!!d.token}`
						);

						const mode = rid ? streamModeRef.current.get(rid) : undefined;
						if ((d.stream_started || d.token) && mode !== "explicit") {
							handleStreamingMessage(message);
						} else if (d.final_response || typeof d.response === "string") {
							// Finalize stream (even if no explicit end event is sent)
							handleCompleteResponse(message);
						} else {
							// Fallback: treat as complete to avoid dropping messages
							console.log(`[JARVIS] Treating jarvis_response as complete (fallback)`);
							handleCompleteResponse(message);
						}
						break;
					}
					case "status_update":
						handleStatusUpdate(message);
						break;
					case "audio_level":
						handleAudioLevel(message);
						break;
					case "wake_word_detected":
						handleVoiceActivation(message);
						break;
					case "error":
						handleErrorMessage(message);
						break;
					case "listening_mode_changed":
						handleListeningModeChange(message);
						break;
					case "meeting_transcription":
						handleMeetingTranscription(message);
						break;
					case "start_meeting_mode":
					case "stop_meeting_mode":
						// These are outbound messages, typically sent by the client
						console.log(`Meeting mode message sent: ${message.type}`);
						break;
					default:
						console.log("Unknown JARVIS message type:", message.type);
				}
			} catch (error) {
				console.error("Error processing JARVIS WebSocket message:", error);
			}
		},
		[
			handleStreamingMessage,
			handleStreamEnd,
			handleCompleteResponse,
			handleStatusUpdate,
			handleAudioLevel,
			handleVoiceActivation,
			handleErrorMessage,
			handleListeningModeChange,
			handleMeetingTranscription,
		]
	);

	// Stable WebSocket options and initialization (must be declared after handlers)
	const wsOptions = useMemo(
		() => ({
			onClose: (event: CloseEvent) => {
				console.warn("[JARVIS] WebSocket closed", {
					code: event.code,
					reason: event.reason,
					wasClean: event.wasClean,
				});
				// Stop heartbeat when closed
				connectionManager.current.stopHeartbeat();
			},
			onError: (event: Event) => {
				console.error("[JARVIS] WebSocket error", event);
				setError("WebSocket encountered an error");
			},
			onMessage: (event: MessageEvent) => {
				// Delegate to our stable message handler
				handleWebSocketMessage(event);
			},
			shouldReconnect: () => connectionManager.current.shouldReconnect(),
			reconnectAttempts: jarvisApiClient.getConfig().websocket.reconnectAttempts,
			reconnectInterval: () => connectionManager.current.getReconnectDelay(),
		}),
		[handleWebSocketMessage]
	);

	const { sendMessage: sendRawMessage, readyState, getWebSocket } = useWebSocket(
		socketUrl,
		wsOptions,
		shouldConnect
	);

	// Derived connection state flags
	const isConnected = readyState === ReadyState.OPEN;
	const isConnecting = readyState === ReadyState.CONNECTING;

	// Connection lifecycle: process queued messages when connected (heartbeat disabled)
	useEffect(() => {
		if (isConnected) {
			connectionManager.current.resetReconnectAttempts();
			setError(null);
			messageQueue.current.processQueue(sendRawMessage);
		}
		return () => {};
	}, [isConnected, sendRawMessage]);

	// Refresh status using REST API fallback
	const refreshStatus = useCallback(async () => {
		if (!isMounted.current) return;
		try {
			const statusResponse = await jarvisApiClient.getStatus();
			if (!isMounted.current) return;
			setStatus(statusResponse);
			if (statusResponse.health.jarvis_status?.capabilities) {
				setCapabilities(statusResponse.health.jarvis_status.capabilities as JarvisCapabilities);
			}
			setError(null);
		} catch (err) {
			if (!isMounted.current) return;
			if (err instanceof JarvisApiError) {
				setError(err.getUserMessage());
			} else {
				setError(err instanceof Error ? err.message : "Failed to connect to JARVIS");
			}
		}
	}, []);

	// Send message to JARVIS via WebSocket
	const sendMessage = useCallback(
		async (message: string, metadata?: Record<string, any>): Promise<JarvisMessageResponse | void> => {
			try {
				setError(null);

				// Add user message to messages immediately
				const userMessage: StreamingMessage = {
					id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
					type: "user",
					content: message,
					timestamp: Date.now(),
					metadata: {
						source: metadata?.source || "text",
						...metadata,
					},
				};

				setMessages((prev) => [...prev, userMessage]);

				// Create WebSocket message
				const wsMessage = JarvisWebSocketUtils.createUserMessage(message, metadata);

				if (isConnected) {
					// Send via WebSocket if connected
					console.log(`[JARVIS] 📤 Sending WebSocket message:`, {
						type: wsMessage.type,
						message_preview: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
						metadata: metadata,
						timestamp: new Date().toISOString(),
					});
					sendRawMessage(JSON.stringify(wsMessage));
					lastMessageRef.current = message;
				} else {
					// Queue message if not connected
					messageQueue.current.enqueue(wsMessage);

					// Fallback to API if WebSocket is not available
					try {
						const response = await jarvisApiClient.sendMessage({
							message,
							userId: metadata?.userId || "anonymous",
							metadata,
						});

						// Add response as complete message
						const responseMessage: StreamingMessage = {
							id: `response-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
							type: "assistant",
							content: response.response,
							timestamp: Date.now(),
							isStreaming: false,
							isComplete: true,
							metadata: response.metadata,
						};

						setMessages((prev) => [...prev, responseMessage]);

						// Update metrics
						if (response.metadata.confidence !== undefined) {
							setConfidence(response.metadata.confidence);
						}
						if (response.metadata.search_sources) {
							setSearchSources(response.metadata.search_sources);
						}
						if (response.metadata.mcp_enhanced !== undefined) {
							setMcpEnhanced(response.metadata.mcp_enhanced);
						}

						return response;
					} catch (apiError) {
						console.error("API fallback failed:", apiError);
						throw apiError;
					}
				}

				// Legacy conversation support
				const turn: JarvisConversationTurn = {
					id: userMessage.id,
					userMessage: message,
					jarvisResponse: "", // Will be updated when response comes
					timestamp: new Date(),
					metadata,
					source: metadata?.source || "text",
					status: "pending",
				};

				setConversations((prev) => [...prev, turn]);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Failed to send message";
				setError(errorMessage);
				throw new Error(errorMessage);
			}
		},
		[isConnected, sendRawMessage]
	);

	// Connect to JARVIS
	const connect = useCallback(async () => {
		if (isConnecting || isConnected) return;

		setError(null);
		// WebSocket connection is handled by useWebSocket hook
		await refreshStatus();
	}, [isConnecting, isConnected, refreshStatus]);

	// Disconnect from JARVIS
	const disconnect = useCallback(() => {
		connectionManager.current.cleanup();
		messageQueue.current.clear();
		setError(null);

		// Close WebSocket if available
		const ws = getWebSocket();
		if (ws) {
			ws.close();
		}
	}, [getWebSocket]);

	// Clear messages
	const clearMessages = useCallback(() => {
		setMessages([]);
		setActiveStreams(new Set());
		finalizedResponsesRef.current.clear();
		console.log("[JARVIS] Cleared all messages and tracking state");
	}, []);

	// Send custom WebSocket message (for meeting mode control)
	const sendCustomMessage = useCallback(
		(type: string, data: any = {}) => {
			if (!isConnected) {
				console.warn("Cannot send custom message: WebSocket not connected");
				return;
			}

			const message = {
				type,
				data,
				timestamp: Date.now(),
				id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
			};

			sendRawMessage(JSON.stringify(message));
		},
		[isConnected, sendRawMessage]
	);

	// Clear conversation history (legacy support)
	const clearConversations = useCallback(() => {
		setConversations([]);
	}, []);

	// Initial setup and cleanup
	useEffect(() => {
		isMounted.current = true;

		// Initial status check
		refreshStatus();

		// Set up periodic status checks (less frequent since WebSocket provides real-time updates)
		const interval = setInterval(() => {
			if (isMounted.current && !isConnected) {
				refreshStatus();
			}
		}, 60000); // Check every minute when not connected

		// Cleanup
		return () => {
			isMounted.current = false;
			clearInterval(interval);
			const manager = connectionManager.current;
			const queue = messageQueue.current;
			if (manager) manager.cleanup();
			if (queue) queue.clear();
		};
	}, [refreshStatus, isConnected]);

	// Update conversation history when streaming completes (legacy support)
	useEffect(() => {
		const completedMessages = messages.filter((msg) => msg.type === "assistant" && msg.isComplete && !msg.isStreaming);

		completedMessages.forEach((msg) => {
			setConversations((prev) => {
				const updated = prev.map((turn) => {
					if (turn.status === "pending" && turn.userMessage && !turn.jarvisResponse) {
						return {
							...turn,
							jarvisResponse: msg.content,
							status: "complete" as const,
							metadata: {
								...turn.metadata,
								...msg.metadata,
							},
						};
					}
					return turn;
				});
				return updated;
			});
		});
	}, [messages]);

	return {
		// Connection state
		isConnected,
		isConnecting,
		error,
		connectionState: readyState,

		// Real-time data
		messages,
		audioLevels,
		status,
		capabilities,

		// Streaming support
		activeStreams,

		// Actions
		sendMessage,
		sendCustomMessage,
		connect,
		disconnect,
		clearMessages,
		refreshStatus,

		// Enhanced features
		confidence,
		searchSources,
		mcpEnhanced,
		lastVoiceActivation,

		// Meeting mode state
		isMeetingMode,
		meetingStartTime,

		// Legacy conversation support
		conversations,
		clearConversations,
	};
}

// Simplified hook for basic WebSocket functionality (legacy support)
export function useJarvisWebSocket() {
	const { isConnected, messages, sendMessage, lastVoiceActivation, audioLevels } = useJarvis();

	const lastMessage = messages[messages.length - 1] || null;

	const sendSimpleMessage = useCallback((type: string, data: any) => {
		const message = JarvisWebSocketUtils.createMessage(type as any, data);
		// This is handled internally by the main useJarvis hook
		console.log("Legacy sendMessage called:", message);
	}, []);

	return {
		isConnected,
		lastMessage,
		sendMessage: sendSimpleMessage,
		audioLevels,
		voiceActivation: lastVoiceActivation,
	};
}
