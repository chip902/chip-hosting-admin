"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, CheckCircle, AlertCircle, RefreshCw, Users, Calendar, Zap } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import GoogleDestinationSetup from "./GoogleDestinationSetup";
import CalDAVDestinationSetup from "./CalDAVDestinationSetup";

interface Agent {
	id: string;
	name: string;
	status: "active" | "inactive";
	last_seen: string;
	event_count: number;
	environment: string;
}

interface Destination {
	provider_type: string;
	calendar_id: string;
	name: string;
	status: string;
}

interface SyncStats {
	total_events: number;
	total_agents: number;
	active_agents: number;
	events_by_agent: Record<string, number>;
	events_by_provider: Record<string, number>;
	last_updated: string;
}

interface GoogleCredentials {
	access_token: string;
	refresh_token: string;
	expires_at?: number;
}

export default function CalendarManagement() {
	// State
	const [agents, setAgents] = useState<Record<string, Agent>>({});
	const [destination, setDestination] = useState<Destination | null>(null);
	const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [authUrl, setAuthUrl] = useState("");
	const [authCode, setAuthCode] = useState("");
	const [credentials, setCredentials] = useState<GoogleCredentials | null>(null);
	const [availableCalendars, setAvailableCalendars] = useState<any[]>([]);
	const [selectedCalendarId, setSelectedCalendarId] = useState("");
	const { toast } = useToast();

	// API Base URL
	const API_BASE = "http://chepurny.com:8008";

	// Load initial data only on client side
	useEffect(() => {
		// Only run on client side to avoid hydration issues
		if (typeof window !== 'undefined') {
			loadAgentStatus();
			loadSyncStats();
			loadConfiguration();
		}
	}, []);

	// API Functions
	const apiCall = async (endpoint: string, options?: RequestInit) => {
		try {
			const response = await fetch(`${API_BASE}${endpoint}`, {
				headers: {
					"Content-Type": "application/json",
					...options?.headers,
				},
				...options,
			});

			if (!response.ok) {
				throw new Error(`API Error: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error(`API call failed for ${endpoint}:`, error);
			throw error;
		}
	};

	const loadAgentStatus = async () => {
		try {
			const data = await apiCall("/sync/agents/status");
			setAgents(data.agent_status || {});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to load agent status",
				variant: "destructive",
			});
		}
	};

	const loadSyncStats = async () => {
		try {
			const data = await apiCall("/sync/stats");
			setSyncStats(data);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to load sync statistics",
				variant: "destructive",
			});
		}
	};

	const loadConfiguration = async () => {
		try {
			const config = await apiCall("/sync/config");
			if (config.destination) {
				setDestination(config.destination);
			}
		} catch (error) {
			console.error("Failed to load configuration:", error);
		}
	};

	// Google Calendar Setup Functions
	const getGoogleAuthUrl = async () => {
		try {
			setLoading(true);
			const data = await apiCall("/sync/config/google/auth-url");
			setAuthUrl(data.auth_url);
			toast({
				title: "Authorization URL Generated",
				description: "Click the link to authorize Google Calendar access",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to generate authorization URL",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const exchangeAuthCode = async () => {
		if (!authCode.trim()) {
			toast({
				title: "Error",
				description: "Please enter the authorization code",
				variant: "destructive",
			});
			return;
		}

		try {
			setLoading(true);
			const data = await apiCall("/sync/config/google/exchange-code", {
				method: "POST",
				body: JSON.stringify({ code: authCode.trim() }),
			});

			setCredentials(data.credentials);
			toast({
				title: "Success",
				description: "Google Calendar access authorized!",
			});

			// Load available calendars
			await loadGoogleCalendars(data.credentials);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to exchange authorization code",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const loadGoogleCalendars = async (creds: GoogleCredentials) => {
		try {
			const data = await apiCall("/sync/config/google/calendars", {
				method: "POST",
				body: JSON.stringify(creds),
			});

			setAvailableCalendars(data.calendars || []);

			// Auto-select primary calendar if available
			const primary = data.calendars?.find((cal: any) => cal.primary);
			if (primary) {
				setSelectedCalendarId(primary.id);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to load Google calendars",
				variant: "destructive",
			});
		}
	};

	const configureGoogleDestination = async () => {
		if (!credentials || !selectedCalendarId) {
			toast({
				title: "Error",
				description: "Please complete Google authorization and select a calendar",
				variant: "destructive",
			});
			return;
		}

		try {
			setLoading(true);
			const data = await apiCall("/sync/config/destination/google", {
				method: "POST",
				body: JSON.stringify({
					calendar_id: selectedCalendarId,
					credentials: credentials,
				}),
			});

			setDestination(data.destination);
			toast({
				title: "Success",
				description: "Google Calendar destination configured successfully!",
			});

			// Refresh configuration
			await loadConfiguration();
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to configure Google Calendar destination",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Sync Operations
	const triggerSync = async () => {
		try {
			setLoading(true);
			const data = await apiCall("/sync/run", { method: "POST" });

			toast({
				title: "Sync Started",
				description: `Processing ${Object.keys(agents).length} agents...`,
			});

			// Reload stats after sync
			setTimeout(() => {
				loadSyncStats();
				loadAgentStatus();
			}, 2000);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to trigger sync",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const testEndToEndSync = async () => {
		try {
			setLoading(true);
			const data = await apiCall("/sync/test/end-to-end", { method: "POST" });

			if (data.status === "success") {
				toast({
					title: "Sync Test Successful",
					description: `Synced ${data.sync_result?.events_synced || 0} events`,
				});
			} else {
				toast({
					title: "Sync Test Result",
					description: data.message,
					variant: data.status === "error" ? "destructive" : "default",
				});
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to run sync test",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Helper functions
	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-500";
			case "inactive":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	const formatTimestamp = (timestamp: string) => {
		try {
			// Use a consistent format to avoid locale-based hydration issues
			const date = new Date(timestamp);
			return date.toISOString().replace('T', ' ').substring(0, 19);
		} catch {
			return "Unknown";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Legacy Calendar Management</h1>
					<p className="text-muted-foreground">Manage calendar synchronization from remote agents</p>
					<Alert className="mt-2">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>New:</strong> For multi-account OAuth sync with Google, Microsoft, and other providers, check out the <strong>Multi-Account Sync</strong> tab for enhanced capabilities.
						</AlertDescription>
					</Alert>
				</div>
				<div className="flex gap-2">
					<Button onClick={loadAgentStatus} variant="outline" size="sm">
						<RefreshCw className="w-4 h-4 mr-2" />
						Refresh
					</Button>
					<Button onClick={testEndToEndSync} disabled={loading || !destination}>
						<Zap className="w-4 h-4 mr-2" />
						Test Sync
					</Button>
					<Button onClick={triggerSync} disabled={loading || !destination}>
						<RefreshCw className="w-4 h-4 mr-2" />
						Sync Now
					</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Users className="h-4 w-4 text-muted-foreground" />
							<div className="ml-2">
								<p className="text-sm font-medium leading-none">Active Agents</p>
								<p className="text-2xl font-bold">
									{syncStats?.active_agents || 0}/{syncStats?.total_agents || 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<div className="ml-2">
								<p className="text-sm font-medium leading-none">Total Events</p>
								<p className="text-2xl font-bold">{syncStats?.total_events?.toLocaleString() || 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<CheckCircle className="h-4 w-4 text-muted-foreground" />
							<div className="ml-2">
								<p className="text-sm font-medium leading-none">Destination</p>
								<div className="text-sm font-medium">
									{destination ? (
										<Badge variant="default">{destination.provider_type} configured</Badge>
									) : (
										<Badge variant="destructive">Not configured</Badge>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<CalendarIcon className="h-4 w-4 text-muted-foreground" />
							<div className="ml-2">
								<p className="text-sm font-medium leading-none">Last Updated</p>
								<p className="text-sm text-muted-foreground">{syncStats?.last_updated ? formatTimestamp(syncStats.last_updated) : "Never"}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Tabs */}
			<Tabs defaultValue="agents" className="space-y-4">
				<TabsList>
					<TabsTrigger value="agents">Remote Agents</TabsTrigger>
					<TabsTrigger value="destination">Destination Setup</TabsTrigger>
					<TabsTrigger value="sync">Sync Management</TabsTrigger>
				</TabsList>

				{/* Remote Agents Tab */}
				<TabsContent value="agents" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Remote Agents Status</CardTitle>
							<CardDescription>Monitor calendar sync agents across your network</CardDescription>
						</CardHeader>
						<CardContent>
							{Object.keys(agents).length === 0 ? (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>No remote agents detected. Make sure your agents are running and sending heartbeats.</AlertDescription>
								</Alert>
							) : (
								<div className="space-y-4">
									{Object.entries(agents).map(([agentId, agent]) => (
										<div key={agentId} className="flex items-center justify-between p-4 border rounded-lg">
											<div className="flex items-center space-x-4">
												<div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
												<div>
													<h4 className="font-medium">{agent.name}</h4>
													<p className="text-sm text-muted-foreground">
														{agent.environment} • {(agent.event_count || 0).toLocaleString()} events
													</p>
												</div>
											</div>
											<div className="text-right">
												<Badge variant={agent.status === "active" ? "default" : "destructive"}>{agent.status}</Badge>
												<p className="text-sm text-muted-foreground mt-1">Last seen: {formatTimestamp(agent.last_seen)}</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Destination Setup Tab */}
				<TabsContent value="destination" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Google Calendar Option */}
						<div>
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<span className="w-6 h-6 bg-blue-500 text-white rounded text-sm flex items-center justify-center">G</span>
								Google Calendar
							</h3>
							<GoogleDestinationSetup 
								currentDestination={destination?.provider_type === 'google' ? destination : null} 
								onDestinationConfigured={setDestination} 
							/>
						</div>

						{/* CalDAV (Mailcow) Option */}
						<div>
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<span className="w-6 h-6 bg-green-500 text-white rounded text-sm flex items-center justify-center">M</span>
								Mailcow CalDAV
							</h3>
							<CalDAVDestinationSetup 
								currentDestination={destination?.provider_type === 'caldav' ? destination : null} 
								onDestinationConfigured={setDestination} 
							/>
						</div>
					</div>

					{/* Information Section */}
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>Choose one destination:</strong> Select either Google Calendar (requires HTTPS) or Mailcow CalDAV (works with HTTP) to receive your synchronized events. You can reconfigure at any time.
						</AlertDescription>
					</Alert>
				</TabsContent>

				{/* Sync Management Tab */}
				<TabsContent value="sync" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Sync Statistics */}
						<Card>
							<CardHeader>
								<CardTitle>Sync Statistics</CardTitle>
							</CardHeader>
							<CardContent>
								{syncStats ? (
									<div className="space-y-4">
										<div>
											<h4 className="font-medium mb-2">Events by Agent</h4>
											{Object.entries(syncStats.events_by_agent || {}).map(([agentId, count]) => (
												<div key={agentId} className="flex justify-between">
													<span className="text-sm">{agents[agentId]?.name || agentId}</span>
													<span className="text-sm font-medium">{count.toLocaleString()}</span>
												</div>
											))}
										</div>

										<div>
											<h4 className="font-medium mb-2">Events by Provider</h4>
											{Object.entries(syncStats.events_by_provider || {}).map(([provider, count]) => (
												<div key={provider} className="flex justify-between">
													<span className="text-sm capitalize">{provider}</span>
													<span className="text-sm font-medium">{count.toLocaleString()}</span>
												</div>
											))}
										</div>
									</div>
								) : (
									<p className="text-muted-foreground">No sync statistics available</p>
								)}
							</CardContent>
						</Card>

						{/* Sync Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Sync Actions</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Button onClick={testEndToEndSync} disabled={loading || !destination} className="w-full">
									<Zap className="w-4 h-4 mr-2" />
									Test End-to-End Sync
								</Button>

								<Button onClick={triggerSync} disabled={loading || !destination} className="w-full" variant="outline">
									<RefreshCw className="w-4 h-4 mr-2" />
									Force Full Sync
								</Button>

								<Button
									onClick={() => {
										loadAgentStatus();
										loadSyncStats();
										loadConfiguration();
									}}
									disabled={loading}
									className="w-full"
									variant="outline">
									<RefreshCw className="w-4 h-4 mr-2" />
									Refresh All Data
								</Button>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
