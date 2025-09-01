"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TestMessage {
	id: string;
	responseId?: string;
	content: string;
	type: 'user' | 'assistant';
	isStreaming: boolean;
	timestamp: number;
}

export default function JarvisTestPage() {
	const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
	const [messages, setMessages] = useState<TestMessage[]>([]);
	const [debugLog, setDebugLog] = useState<string[]>([]);
	const [input, setInput] = useState('Hello JARVIS, please respond with a simple greeting.');
	const [isProcessing, setIsProcessing] = useState(false);
	
	const wsRef = useRef<WebSocket | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const debugEndRef = useRef<HTMLDivElement>(null);

	const log = (message: string) => {
		const timestamp = new Date().toLocaleTimeString();
		const logEntry = `[${timestamp}] ${message}`;
		console.log(logEntry);
		setDebugLog(prev => [...prev, logEntry]);
	};

	const updateMessage = (responseId: string, content: string, isStreaming: boolean = true) => {
		setMessages(prev => {
			const existingIndex = prev.findIndex(m => m.responseId === responseId);
			
			if (existingIndex !== -1) {
				const updated = [...prev];
				updated[existingIndex] = {
					...updated[existingIndex],
					content,
					isStreaming
				};
				return updated;
			} else {
				return [...prev, {
					id: `msg-${responseId}`,
					responseId,
					content,
					type: 'assistant',
					isStreaming,
					timestamp: Date.now()
				}];
			}
		});
	};

	const connectWebSocket = () => {
		if (wsRef.current?.readyState === WebSocket.OPEN) return;

		setWsStatus('connecting');
		log('🔄 Connecting to JARVIS WebSocket...');

		const WS_URL = process.env.NEXT_PUBLIC_JARVIS_WS_URL || 'ws://localhost:8765/ws';
		wsRef.current = new WebSocket(WS_URL);

		wsRef.current.onopen = () => {
			log('✅ Connected to JARVIS WebSocket');
			setWsStatus('connected');
		};

		wsRef.current.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				log(`📥 ${message.type} (ID: ${message.data?.response_id || 'none'})`);

				switch (message.type) {
					case 'jarvis_response_stream':
						if (message.data.stream_started) {
							log(`🔄 Stream started: ${message.data.response_id}`);
							updateMessage(message.data.response_id, '', true);
							setIsProcessing(true);
						} else if (message.data.token) {
							const token = message.data.token;
							const isComplete = message.data.is_complete;
							log(`📝 Token: "${token}" ${isComplete ? '(COMPLETE)' : ''}`);
							
							setMessages(prev => {
								const msgIndex = prev.findIndex(m => m.responseId === message.data.response_id);
								if (msgIndex !== -1) {
									const updated = [...prev];
									const currentMsg = updated[msgIndex];
									updated[msgIndex] = {
										...currentMsg,
										content: currentMsg.content + token,
										isStreaming: !isComplete
									};
									return updated;
								}
								
								// Create new message if none exists
								return [...prev, {
									id: `msg-${message.data.response_id}`,
									responseId: message.data.response_id,
									content: token,
									type: 'assistant',
									isStreaming: !isComplete,
									timestamp: Date.now()
								}];
							});

							if (isComplete) {
								setIsProcessing(false);
								log(`✅ Stream completed for ${message.data.response_id}`);
							}
						}
						break;

					case 'jarvis_response_end':
						log(`🏁 Stream end: ${message.data.response_id}`);
						const finalContent = message.data.final_response;
						if (finalContent) {
							updateMessage(message.data.response_id, finalContent, false);
						}
						setIsProcessing(false);
						break;

					case 'status_update':
						log(`📊 Status update received`);
						break;

					default:
						log(`❓ Unknown message type: ${message.type}`);
				}
			} catch (error) {
				log(`❌ Parse error: ${error}`);
			}
		};

		wsRef.current.onerror = (error) => {
			log(`❌ WebSocket error: ${error}`);
			setWsStatus('disconnected');
		};

		wsRef.current.onclose = (event) => {
			log(`🔌 Connection closed (${event.code}): ${event.reason || 'No reason'}`);
			setWsStatus('disconnected');
			setIsProcessing(false);
			
			// Auto-reconnect after 3 seconds
			setTimeout(() => {
				if (wsRef.current?.readyState !== WebSocket.OPEN) {
					log('🔄 Attempting to reconnect...');
					connectWebSocket();
				}
			}, 3000);
		};
	};

	const sendMessage = () => {
		if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isProcessing) return;

		const message = input.trim();
		
		// Add user message
		setMessages(prev => [...prev, {
			id: `user-${Date.now()}`,
			content: message,
			type: 'user',
			isStreaming: false,
			timestamp: Date.now()
		}]);

		const wsMessage = {
			type: 'user_message',
			data: {
				message,
				metadata: {
					timestamp: Date.now(),
					source: 'test_page',
					session_id: 'jarvis-test-session'
				}
			},
			timestamp: Date.now(),
			id: `test-${Date.now()}`
		};

		log(`📤 Sending: "${message}"`);
		wsRef.current.send(JSON.stringify(wsMessage));
		setInput('');
		setIsProcessing(true);
	};

	const clearLogs = () => {
		setDebugLog([]);
		setMessages([]);
		setIsProcessing(false);
	};

	useEffect(() => {
		connectWebSocket();
		
		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, []);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	useEffect(() => {
		debugEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [debugLog]);

	const getStatusColor = () => {
		switch (wsStatus) {
			case 'connected': return 'bg-green-500';
			case 'connecting': return 'bg-yellow-500';
			case 'disconnected': return 'bg-red-500';
		}
	};

	return (
		<div className="container mx-auto max-w-4xl p-6 space-y-6">
			<Card className="p-6">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-bold">🤖 JARVIS Streaming Test</h1>
					<div className="flex items-center gap-2">
						<div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
						<Badge variant={wsStatus === 'connected' ? 'default' : 'secondary'}>
							{wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
						</Badge>
					</div>
				</div>

				<div className="flex gap-2 mb-4">
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type your message here..."
						onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
						disabled={wsStatus !== 'connected' || isProcessing}
						className="flex-1"
					/>
					<Button 
						onClick={sendMessage}
						disabled={wsStatus !== 'connected' || isProcessing || !input.trim()}
					>
						{isProcessing ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
								Processing...
							</>
						) : (
							'Send'
						)}
					</Button>
				</div>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Messages */}
				<Card className="p-4">
					<h3 className="text-lg font-semibold mb-3">Messages ({messages.length})</h3>
					<div className="space-y-2 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded">
						{messages.length === 0 ? (
							<div className="text-gray-500 text-center py-4">No messages yet</div>
						) : (
							messages.map((msg) => (
								<div
									key={msg.id}
									className={`p-3 rounded-lg ${
										msg.type === 'user' 
											? 'bg-blue-500 text-white ml-auto max-w-[80%]' 
											: `bg-white border-l-4 ${
												msg.isStreaming 
													? 'border-green-500 bg-green-50' 
													: 'border-gray-300'
											}`
									}`}
								>
									<div className="flex items-center justify-between mb-1">
										<strong className="text-sm">
											{msg.type === 'user' ? 'You' : 'JARVIS'}
										</strong>
										{msg.isStreaming && (
											<Badge variant="outline" className="text-xs">
												Streaming...
											</Badge>
										)}
									</div>
									<div className="text-sm whitespace-pre-wrap">
										{msg.content}
										{msg.isStreaming && (
											<span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1" />
										)}
									</div>
								</div>
							))
						)}
						<div ref={messagesEndRef} />
					</div>
				</Card>

				{/* Debug Log */}
				<Card className="p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-semibold">Debug Log ({debugLog.length})</h3>
						<Button variant="outline" size="sm" onClick={clearLogs}>
							Clear All
						</Button>
					</div>
					<div className="max-h-96 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
						{debugLog.length === 0 ? (
							<div className="text-gray-500">Debug log will appear here...</div>
						) : (
							debugLog.map((entry, index) => (
								<div key={index} className="mb-1">
									{entry}
								</div>
							))
						)}
						<div ref={debugEndRef} />
					</div>
				</Card>
			</div>

			<Card className="p-4">
				<h3 className="text-lg font-semibold mb-2">Test Instructions</h3>
				<div className="text-sm text-gray-600 space-y-2">
					<p>• <strong>WebSocket URL:</strong> {process.env.NEXT_PUBLIC_JARVIS_WS_URL || 'ws://localhost:8765/ws'}</p>
					<p>• <strong>Expected Behavior:</strong> Tokens should stream in real-time</p>
					<p>• <strong>Check:</strong> Watch the debug log for token updates and message changes</p>
					<p>• <strong>Issue:</strong> If tokens appear in debug but messages don't update, it's a React rendering issue</p>
				</div>
			</Card>
		</div>
	);
}