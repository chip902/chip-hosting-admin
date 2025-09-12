"use client";

import React, { useState, useEffect } from "react";
import { CalendarClient } from "@/lib/CalendarClient";
import { RemoteAgent, RemoteAgentStatus } from "@/types/calendar";

interface RemoteAgentStatusProps {
	calendarClient: CalendarClient | null;
}

export const RemoteAgentStatusComponent: React.FC<RemoteAgentStatusProps> = ({
	calendarClient,
}) => {
	const [agents, setAgents] = useState<RemoteAgent[]>([]);
	const [agentStatuses, setAgentStatuses] = useState<Record<string, RemoteAgentStatus>>({});
	const [loading, setLoading] = useState(false); // Start with false to avoid hydration mismatch
	const [error, setError] = useState<string | null>(null);

	// Return early if no calendarClient
	if (!calendarClient) {
		return (
			<div className="bg-card rounded-lg shadow border border-border p-4">
				<h3 className="text-14 font-semibold mb-3">Remote Agents</h3>
				<div className="text-14 text-muted-foreground">Calendar client not initialized</div>
			</div>
		);
	}

	const fetchAgents = async () => {
		try {
			setLoading(true);
			const agentsData = await calendarClient.getRemoteAgents();
			setAgents(agentsData);

			// Fetch detailed status for each agent
			const statusPromises = agentsData.map(async (agent) => {
				try {
					const status = await calendarClient.getRemoteAgentStatus(agent.id);
					return { agentId: agent.id, status };
				} catch (err) {
					// Status endpoint not implemented on server - use fallback status
					console.warn(`Status endpoint not available for agent ${agent.id}`);
					return { 
						agentId: agent.id, 
						status: {
							agent_id: agent.id,
							status: agent.status || "unknown",
							last_heartbeat: agent.last_heartbeat || new Date().toISOString(),
							heartbeat_count: 0,
							environment: agent.environment,
							error_message: undefined,
							recent_heartbeats: []
						} as RemoteAgentStatus
					};
				}
			});

			const statusResults = await Promise.all(statusPromises);
			const statusMap: Record<string, RemoteAgentStatus> = {};
			
			statusResults.forEach((result) => {
				if (result) {
					statusMap[result.agentId] = result.status;
				}
			});

			setAgentStatuses(statusMap);
		} catch (err) {
			console.error("Error fetching remote agents:", err);
			setError("Failed to load remote agents");
		} finally {
			setLoading(false);
		}
	};


	useEffect(() => {
		// Only run on client side to avoid hydration issues
		if (typeof window !== 'undefined') {
			fetchAgents();
			// Set up polling for status updates every 30 seconds
			const interval = setInterval(fetchAgents, 30000);
			return () => clearInterval(interval);
		}
	}, [calendarClient]);

	const getStatusBadgeColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "syncing":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
			case "error":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
			case "inactive":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
		}
	};

	const formatTimestamp = (timestamp?: string) => {
		if (!timestamp) return "Never";
		// Use a consistent format to avoid locale-based hydration issues
		const date = new Date(timestamp);
		return date.toISOString().replace('T', ' ').substring(0, 19);
	};

	const getTimeSinceHeartbeat = (timestamp?: string) => {
		if (!timestamp) return "Never";
		const now = new Date();
		const heartbeatTime = new Date(timestamp);
		const diffMs = now.getTime() - heartbeatTime.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		
		if (diffMinutes < 1) return "Just now";
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		
		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		
		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays}d ago`;
	};

	// Show loading state
	if (loading) {
		return (
			<div className="bg-card rounded-lg shadow border border-border p-4">
				<h3 className="text-14 font-semibold mb-3">Remote Agents</h3>
				<div className="animate-pulse space-y-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-12 bg-muted rounded"></div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-card rounded-lg shadow border border-border p-4">
				<h3 className="text-14 font-semibold mb-3">Remote Agents</h3>
				<div className="text-destructive text-14">{error}</div>
				<button
					onClick={fetchAgents}
					className="mt-2 text-primary hover:text-primary/80 text-14"
				>
					Try again
				</button>
			</div>
		);
	}

	return (
		<div className="bg-card rounded-lg shadow border border-border">
			<div className="px-4 py-3 border-b border-border">
				<div className="flex items-center justify-between">
					<h3 className="text-14 font-semibold">Remote Agents</h3>
					<button
						onClick={fetchAgents}
						className="text-12 text-primary hover:text-primary/80"
					>
						Refresh
					</button>
				</div>
			</div>

			{agents.length === 0 ? (
				<div className="px-4 py-6 text-center">
					<p className="text-14 text-muted-foreground">No agents connected</p>
				</div>
			) : (
				<div className="divide-y divide-border">
					{agents.map((agent) => {
						return (
							<div key={agent.id} className="px-4 py-3">
								<div className="flex items-center justify-between">
									<div className="flex-1 min-w-0">
										<div className="flex items-center space-x-2">
											<div className="text-14 font-medium truncate">
												{agent.name}
											</div>
											<span
												className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
													agent.status
												)}`}
											>
												{agent.status}
											</span>
										</div>
										<div className="mt-1 text-12 text-muted-foreground">
											<div className="truncate">{agent.environment}</div>
											<div className="mt-0.5">
												Last seen: {getTimeSinceHeartbeat(agent.last_heartbeat)}
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
