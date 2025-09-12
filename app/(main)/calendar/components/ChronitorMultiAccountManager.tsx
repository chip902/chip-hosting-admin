"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Settings, Trash2, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Users, Zap, Mail } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";

// Chroniton Capacitor API configuration
const CHRONITON_API_URL = process.env.NEXT_PUBLIC_CHRONITON_API_URL || "http://ark:8008";

interface GoogleCredentials {
	token_type: string;
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

interface Calendar {
	id: string;
	summary: string;
	description?: string;
	primary?: boolean;
	accessRole: string;
}

interface SyncSource {
	id: string;
	name: string;
	provider_type: string;
	calendars: string[];
	credentials: GoogleCredentials;
	sync_direction: string;
	sync_method: string;
	enabled: boolean;
	last_sync?: string;
}

interface SyncDestination {
	id: string;
	name: string;
	provider_type: string;
	calendar_id: string;
	credentials: GoogleCredentials;
	conflict_resolution: string;
	color_management: string;
}

interface SyncOperation {
	status: "started" | "completed" | "failed";
	operation_id?: string;
	message: string;
	start_time?: string;
	events_synced?: number;
}

export default function ChronitorMultiAccountManager() {
	const [accounts, setAccounts] = useState<Map<string, GoogleCredentials>>(new Map());
	const [availableCalendars, setAvailableCalendars] = useState<Map<string, Calendar[]>>(new Map());
	const [syncSources, setSyncSources] = useState<SyncSource[]>([]);
	const [syncDestination, setSyncDestination] = useState<SyncDestination | null>(null);
	const [loading, setLoading] = useState(false);
	const [authUrl, setAuthUrl] = useState("");
	const [authCode, setAuthCode] = useState("");
	const [accountName, setAccountName] = useState("");
	const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);
	const [lastSyncResult, setLastSyncResult] = useState<SyncOperation | null>(null);
	const { toast } = useToast();

	useEffect(() => {
		loadExistingConfiguration();
	}, []);

	// API helper function
	const apiCall = async (endpoint: string, options?: RequestInit) => {
		try {
			const response = await fetch(`${CHRONITON_API_URL}${endpoint}`, {
				headers: {
					"Content-Type": "application/json",
					...options?.headers,
				},
				...options,
			});

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(`API Error (${response.status}): ${errorData}`);
			}

			return await response.json();
		} catch (error) {
			console.error(`API call failed for ${endpoint}:`, error);
			throw error;
		}
	};

	// Load existing configuration
	const loadExistingConfiguration = async () => {
		try {
			setLoading(true);

			// Load sync sources
			const sources = await apiCall("/sync/sources");
			setSyncSources(sources || []);

			// Load sync configuration (includes destination)
			const config = await apiCall("/sync/config");
			if (config.destination) {
				setSyncDestination(config.destination);
			}

			// Extract credentials from sources
			const accountMap = new Map<string, GoogleCredentials>();
			sources.forEach((source: SyncSource, index: number) => {
				if (source.provider_type === "google" && source.credentials) {
					const accountKey = `account_${index}_${source.name}`;
					accountMap.set(accountKey, source.credentials);
				}
			});
			setAccounts(accountMap);
		} catch (error) {
			console.error("Failed to load configuration:", error);
			toast({
				title: "Error",
				description: "Failed to load existing configuration",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Step 1: Get Google OAuth authorization URL
	const getGoogleAuthUrl = async () => {
		try {
			setLoading(true);
			const data = await apiCall("/sync/config/google/auth-url");
			setAuthUrl(data.auth_url);
			toast({
				title: "Authorization URL Generated",
				description: "Copy the URL and visit it in a new tab to authorize access",
			});
		} catch (error: any) {
			toast({
				title: "Error",
				description: "Failed to generate authorization URL: " + error.message,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Step 2: Exchange authorization code for tokens
	const exchangeAuthCode = async () => {
		if (!authCode.trim() || !accountName.trim()) {
			toast({
				title: "Error",
				description: "Please enter both account name and authorization code",
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

			const credentials: GoogleCredentials = data.credentials;

			// Store the account
			const accountKey = `${accountName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
			setAccounts((prev) => new Map(prev.set(accountKey, credentials)));

			// Load calendars for this account
			await loadCalendarsForAccount(accountKey, credentials);

			toast({
				title: "Success",
				description: `${accountName} account added successfully!`,
			});

			// Reset form
			setAuthCode("");
			setAccountName("");
			setAuthUrl("");
			setAddAccountDialogOpen(false);
		} catch (error: any) {
			toast({
				title: "Error",
				description: "Failed to exchange authorization code: " + error.message,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Step 3: Load calendars for an account
	const loadCalendarsForAccount = async (accountKey: string, credentials: GoogleCredentials) => {
		try {
			const data = await apiCall("/sync/config/google/calendars", {
				method: "POST",
				body: JSON.stringify(credentials),
			});

			setAvailableCalendars((prev) => new Map(prev.set(accountKey, data.calendars || [])));
		} catch (error: any) {
			toast({
				title: "Error",
				description: `Failed to load calendars for ${accountKey}: ${error.message}`,
				variant: "destructive",
			});
		}
	};

	// Step 4: Create sync source from account
	const createSyncSource = async (accountKey: string, selectedCalendarIds: string[]) => {
		try {
			const credentials = accounts.get(accountKey);
			const calendars = availableCalendars.get(accountKey) || [];

			if (!credentials) {
				throw new Error("Account credentials not found");
			}

			if (selectedCalendarIds.length === 0) {
				toast({
					title: "Error",
					description: "Please select at least one calendar to sync",
					variant: "destructive",
				});
				return;
			}

			setLoading(true);

			const sourceData = {
				id: `google_${accountKey}`,
				name: `${accountKey.replace(/_/g, " ")} Calendars`,
				provider_type: "google",
				calendars: selectedCalendarIds,
				connection_info: {
					api_base_url: "https://www.googleapis.com/calendar/v3",
					scopes: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
				},
				credentials: credentials,
				sync_method: "api",
				sync_direction: "bidirectional",
				enabled: true,
			};

			const result = await apiCall("/sync/sources", {
				method: "POST",
				body: JSON.stringify(sourceData),
			});

			// Reload sources
			await loadExistingConfiguration();

			toast({
				title: "Success",
				description: `Sync source created for ${accountKey}`,
			});
		} catch (error: any) {
			toast({
				title: "Error",
				description: "Failed to create sync source: " + error.message,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Set up destination calendar
	const setupDestination = async (accountKey: string, calendarId: string) => {
		try {
			const credentials = accounts.get(accountKey);
			if (!credentials) {
				throw new Error("Account credentials not found");
			}

			setLoading(true);

			const result = await apiCall("/sync/config/destination/google", {
				method: "POST",
				body: JSON.stringify({
					calendar_id: calendarId,
					credentials: credentials,
				}),
			});

			setSyncDestination(result.destination);

			toast({
				title: "Success",
				description: "Destination calendar configured successfully!",
			});

			// Reload configuration
			await loadExistingConfiguration();
		} catch (error: any) {
			toast({
				title: "Error",
				description: "Failed to setup destination: " + error.message,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Run bidirectional sync
	const runSync = async () => {
		try {
			setLoading(true);
			const result = await apiCall("/sync/run", { method: "POST" });

			setLastSyncResult(result);

			if (result.status === "started") {
				toast({
					title: "Sync Started",
					description: `Operation ID: ${result.operation_id}`,
				});

				// Poll for completion (optional)
				setTimeout(async () => {
					try {
						const stats = await apiCall("/sync/stats");
						toast({
							title: "Sync Update",
							description: `Processed ${stats.total_events} events from ${stats.active_agents} agents`,
						});
					} catch (error) {
						// Ignore polling errors
					}
				}, 5000);
			} else {
				toast({
					title: "Sync Failed",
					description: result.message,
					variant: "destructive",
				});
			}
		} catch (error: any) {
			toast({
				title: "Error",
				description: "Failed to run sync: " + error.message,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Remove account
	const removeAccount = (accountKey: string) => {
		setAccounts((prev) => {
			const newMap = new Map(prev);
			newMap.delete(accountKey);
			return newMap;
		});
		setAvailableCalendars((prev) => {
			const newMap = new Map(prev);
			newMap.delete(accountKey);
			return newMap;
		});
		toast({
			title: "Account Removed",
			description: `${accountKey} has been removed`,
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Multi-Account Calendar Sync</h2>
					<p className="text-muted-foreground">Manage multiple Google accounts and sync calendars bidirectionally</p>
				</div>
				<div className="flex gap-2">
					<Dialog open={addAccountDialogOpen} onOpenChange={setAddAccountDialogOpen}>
						<DialogTrigger asChild>
							<Button className="gap-2">
								<Plus className="w-4 h-4" />
								Add Account
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Add Google Account</DialogTitle>
								<DialogDescription>Follow the steps below to add a new Google account for calendar sync</DialogDescription>
							</DialogHeader>

							<div className="space-y-4">
								<div>
									<Label htmlFor="accountName">Account Name</Label>
									<Input
										id="accountName"
										placeholder="e.g., Work Gmail, Personal Gmail"
										value={accountName}
										onChange={(e) => setAccountName(e.target.value)}
									/>
								</div>

								{!authUrl ? (
									<Button onClick={getGoogleAuthUrl} disabled={loading} className="w-full">
										{loading ? "Generating..." : "1. Generate Authorization URL"}
									</Button>
								) : (
									<div className="space-y-2">
										<Label>Step 2: Visit Authorization URL</Label>
										<div className="flex gap-2">
											<Input value={authUrl} readOnly className="text-xs" />
											<Button size="sm" onClick={() => window.open(authUrl, "_blank")} className="gap-1">
												<ExternalLink className="w-3 h-3" />
												Open
											</Button>
										</div>
										<p className="text-xs text-muted-foreground">Click Open to visit Google authorization page in a new tab</p>
									</div>
								)}

								{authUrl && (
									<div className="space-y-2">
										<Label htmlFor="authCode">Step 3: Authorization Code</Label>
										<Input
											id="authCode"
											placeholder="Paste the authorization code here"
											value={authCode}
											onChange={(e) => setAuthCode(e.target.value)}
										/>
										<p className="text-xs text-muted-foreground">Copy the code from the callback URL after granting permissions</p>
									</div>
								)}
							</div>

							<DialogFooter>
								<Button onClick={exchangeAuthCode} disabled={loading || !authCode.trim() || !accountName.trim()} className="w-full">
									{loading ? "Adding Account..." : "Add Account"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Button onClick={runSync} disabled={loading || !syncDestination} className="gap-2">
						<Zap className="w-4 h-4" />
						Run Sync
					</Button>
				</div>
			</div>

			{/* Quick Status */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Users className="h-4 w-4 text-muted-foreground" />
							<div className="ml-2">
								<p className="text-sm font-medium">Accounts</p>
								<p className="text-2xl font-bold">{accounts.size}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<div className="ml-2">
								<p className="text-sm font-medium">Sync Sources</p>
								<p className="text-2xl font-bold">{syncSources.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<CheckCircle className="h-4 w-4 text-muted-foreground" />
							<div className="ml-2">
								<p className="text-sm font-medium">Destination</p>
								<div className="text-sm font-medium">
									{syncDestination ? <Badge variant="default">Configured</Badge> : <Badge variant="destructive">Not Set</Badge>}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<RefreshCw className="h-4 w-4 text-muted-foreground" />
							<div className="ml-2">
								<p className="text-sm font-medium">Last Sync</p>
								<p className="text-sm text-muted-foreground">
									{lastSyncResult ? lastSyncResult.start_time?.split("T")[1]?.split(".")[0] || "Running" : "Never"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Accounts & Sources */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Mail className="w-5 h-5" />
							Google Accounts
						</CardTitle>
						<CardDescription>Manage your Google accounts and create sync sources</CardDescription>
					</CardHeader>
					<CardContent>
						{accounts.size === 0 ? (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>No Google accounts added yet. Click "Add Account" to get started.</AlertDescription>
							</Alert>
						) : (
							<div className="space-y-4">
								{Array.from(accounts.entries()).map(([accountKey, credentials]) => (
									<AccountCard
										key={accountKey}
										accountKey={accountKey}
										credentials={credentials}
										calendars={availableCalendars.get(accountKey) || []}
										onCreateSource={createSyncSource}
										onSetupDestination={setupDestination}
										onRemove={removeAccount}
										onLoadCalendars={() => loadCalendarsForAccount(accountKey, credentials)}
										isDestination={syncDestination?.credentials?.access_token === credentials.access_token}
									/>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Sync Configuration */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="w-5 h-5" />
							Sync Configuration
						</CardTitle>
						<CardDescription>Current sync setup and status</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Destination */}
						<div>
							<h4 className="font-medium mb-2">Destination Calendar</h4>
							{syncDestination ? (
								<div className="p-3 border rounded-lg">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">{syncDestination.name}</p>
											<p className="text-sm text-muted-foreground">
												{syncDestination.provider_type} • {syncDestination.calendar_id}
											</p>
										</div>
										<Badge variant="default">Active</Badge>
									</div>
								</div>
							) : (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>No destination calendar configured. Set one up from an account above.</AlertDescription>
								</Alert>
							)}
						</div>

						<Separator />

						{/* Sync Sources */}
						<div>
							<h4 className="font-medium mb-2">Sync Sources ({syncSources.length})</h4>
							{syncSources.length === 0 ? (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>No sync sources configured. Create sources from your accounts above.</AlertDescription>
								</Alert>
							) : (
								<div className="space-y-2">
									{syncSources.map((source) => (
										<div key={source.id} className="p-3 border rounded-lg">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">{source.name}</p>
													<p className="text-sm text-muted-foreground">
														{source.calendars.length} calendars • {source.provider_type}
													</p>
												</div>
												<Badge variant={source.enabled ? "default" : "secondary"}>{source.enabled ? "Enabled" : "Disabled"}</Badge>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<Separator />

						{/* Last Sync Result */}
						{lastSyncResult && (
							<div>
								<h4 className="font-medium mb-2">Last Sync Result</h4>
								<div className="p-3 border rounded-lg">
									<div className="flex items-center gap-2 mb-1">
										{lastSyncResult.status === "started" && <RefreshCw className="w-4 h-4 animate-spin" />}
										{lastSyncResult.status === "completed" && <CheckCircle className="w-4 h-4 text-green-600" />}
										{lastSyncResult.status === "failed" && <AlertCircle className="w-4 h-4 text-red-600" />}
										<Badge
											variant={
												lastSyncResult.status === "completed"
													? "default"
													: lastSyncResult.status === "failed"
														? "destructive"
														: "secondary"
											}>
											{lastSyncResult.status}
										</Badge>
									</div>
									<p className="text-sm">{lastSyncResult.message}</p>
									{lastSyncResult.operation_id && (
										<p className="text-xs text-muted-foreground mt-1">Operation ID: {lastSyncResult.operation_id}</p>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// Account Card Component
interface AccountCardProps {
	accountKey: string;
	credentials: GoogleCredentials;
	calendars: Calendar[];
	onCreateSource: (accountKey: string, selectedCalendarIds: string[]) => void;
	onSetupDestination: (accountKey: string, calendarId: string) => void;
	onRemove: (accountKey: string) => void;
	onLoadCalendars: () => void;
	isDestination: boolean;
}

function AccountCard({ accountKey, credentials, calendars, onCreateSource, onSetupDestination, onRemove, onLoadCalendars, isDestination }: AccountCardProps) {
	const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
	const [destinationCalendar, setDestinationCalendar] = useState("");

	useEffect(() => {
		if (calendars.length > 0) {
			// Auto-select primary calendar
			const primary = calendars.find((cal) => cal.primary);
			if (primary) {
				setSelectedCalendars([primary.id]);
				setDestinationCalendar(primary.id);
			}
		}
	}, [calendars]);

	const displayName = accountKey.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
	const isExpired = credentials.expires_at < Date.now() / 1000;

	return (
		<div className="border rounded-lg p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<h4 className="font-medium">{displayName}</h4>
					<p className="text-sm text-muted-foreground">
						{calendars.length} calendars available
						{isDestination && " • Destination"}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{isExpired && <Badge variant="destructive">Token Expired</Badge>}
					{isDestination && <Badge variant="default">Destination</Badge>}
					<Button variant="ghost" size="sm" onClick={() => onRemove(accountKey)} className="text-red-600 hover:text-red-700">
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{calendars.length === 0 ? (
				<Button onClick={onLoadCalendars} variant="outline" size="sm" className="w-full">
					<RefreshCw className="w-4 h-4 mr-2" />
					Load Calendars
				</Button>
			) : (
				<div className="space-y-3">
					{/* Calendar Selection */}
					<div>
						<Label className="text-sm">Select Calendars to Sync:</Label>
						<div className="mt-1 space-y-2 max-h-32 overflow-y-auto">
							{calendars.map((calendar) => (
								<div key={calendar.id} className="flex items-center space-x-2">
									<Checkbox
										id={`${accountKey}-${calendar.id}`}
										checked={selectedCalendars.includes(calendar.id)}
										onCheckedChange={(checked) => {
											if (checked) {
												setSelectedCalendars((prev) => [...prev, calendar.id]);
											} else {
												setSelectedCalendars((prev) => prev.filter((id) => id !== calendar.id));
											}
										}}
									/>
									<Label htmlFor={`${accountKey}-${calendar.id}`} className="text-sm">
										{calendar.summary}
										{calendar.primary && <span className="text-blue-600"> (Primary)</span>}
									</Label>
								</div>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-2">
						<Button
							onClick={() => onCreateSource(accountKey, selectedCalendars)}
							disabled={selectedCalendars.length === 0}
							size="sm"
							className="flex-1">
							Create Sync Source
						</Button>

						{!isDestination && (
							<Select value={destinationCalendar} onValueChange={setDestinationCalendar}>
								<SelectTrigger className="flex-1">
									<SelectValue placeholder="Choose destination" />
								</SelectTrigger>
								<SelectContent>
									{calendars.map((calendar) => (
										<SelectItem key={calendar.id} value={calendar.id}>
											{calendar.summary}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{!isDestination && destinationCalendar && (
							<Button onClick={() => onSetupDestination(accountKey, destinationCalendar)} size="sm" variant="outline">
								Set as Destination
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
