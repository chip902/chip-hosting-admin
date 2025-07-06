"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { CalendarClient } from "@/lib/CalendarClient";
import { SyncDestination, CalendarProvider } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, RefreshCw, Calendar, Loader2 } from "lucide-react";
import { RemoteAgentStatusComponent } from "./components/RemoteAgentStatus";
import { SourceManagementComponent } from "./components/SourceManagement";

// Initial setup with environment variables
// Use the master sync server URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || "/api/calendar";
const MASTER_SYNC_URL = process.env.NEXT_PUBLIC_CALENDAR_MICROSERVICE_URL || API_URL;
const calendarClient = new CalendarClient(MASTER_SYNC_URL);

// Helper function to get URL parameters
function getUrlParameter(name: string): string | null {
	if (typeof window === "undefined") return null;
	const params = new URLSearchParams(window.location.search);
	return params.get(name);
}

export default function CalendarSyncIntegration({ onEventsLoaded }: { onEventsLoaded: (events: any[]) => void }) {
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);
	const [authError, setAuthError] = useState<string | null>(null);

	// Authentication state
	const [googleAuth, setGoogleAuth] = useState<boolean>(false);
	const [microsoftAuth, setMicrosoftAuth] = useState<boolean>(false);
	const [appleAuth, setAppleAuth] = useState<boolean>(false);
	const [exchangeAuth, setExchangeAuth] = useState<boolean>(false);

	// State
	const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error" | "success">("idle");
	const [lastSync, setLastSync] = useState<string | null>(null);
	const [syncError, setSyncError] = useState<string | null>(null);
	const [syncConfigured, setSyncConfigured] = useState<boolean>(false);

	// Handle OAuth callback
	useEffect(() => {
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");
		const provider = searchParams.get("provider") as CalendarProvider | null;

		const handleAuthCallback = async () => {
			if (error) {
				setAuthError(`Authentication failed: ${error}`);
				return;
			}

			if (code && provider) {
				try {
					setIsProcessingAuth(true);
					setAuthError(null);

					// Exchange the authorization code for tokens
					await calendarClient.exchangeAuthCode(provider, code, state || undefined);

					// Update the auth state based on the provider
					switch (provider) {
						case CalendarProvider.GOOGLE:
							setGoogleAuth(true);
							console.log("Google auth state updated to true");
							break;
						case CalendarProvider.MICROSOFT:
							setMicrosoftAuth(true);
							console.log("Microsoft auth state updated to true");
							break;
						case CalendarProvider.APPLE:
							setAppleAuth(true);
							console.log("Apple auth state updated to true");
							break;
						case CalendarProvider.EXCHANGE:
							setExchangeAuth(true);
							console.log("Exchange auth state updated to true");
							break;
					}

					// Remove the code from URL
					const url = new URL(window.location.href);
					url.searchParams.delete("code");
					url.searchParams.delete("state");
					url.searchParams.delete("provider");
					window.history.replaceState({}, document.title, url.toString());

					// Reload to update the UI with the new auth state
					setTimeout(() => {
						window.location.reload();
					}, 100);
				} catch (err: any) {
					console.error("Error during OAuth callback:", err);
					setAuthError(`Authentication failed: ${err.message}`);
				} finally {
					setIsProcessingAuth(false);
				}
			}
		};

		handleAuthCallback();
	}, [searchParams]);

	// Initialize and check existing configuration
	useEffect(() => {
		checkSyncConfiguration();
	}, []);

	// Check if we have a sync configuration
	const checkSyncConfiguration = async () => {
		try {
			console.log("Checking sync configuration...");
			const config = await calendarClient.getSyncConfiguration();

			// Check if we have a destination configured
			console.log("🔧 Sync config received:", config);
			if (config.destination) {
				setSyncConfigured(true);
				console.log("✅ Sync configured with destination:", config.destination.name);

				// Get events from the destination calendar
				await fetchCalendarEvents();
			} else {
				console.log("❌ No destination configured in sync config");
			}

			// Check for authenticated providers
			if (config.sources) {
				config.sources.forEach((source) => {
					if (source.providerType === CalendarProvider.GOOGLE) {
						setGoogleAuth(true);
					} else if (source.providerType === CalendarProvider.MICROSOFT) {
						setMicrosoftAuth(true);
					} else if (source.providerType === CalendarProvider.APPLE) {
						setAppleAuth(true);
					} else if (source.providerType === CalendarProvider.EXCHANGE) {
						setExchangeAuth(true);
					}
				});
			}
		} catch (err: any) {
			console.error("Error checking sync configuration:", err);
		}
	};

	// Fetch calendar events to display
	const fetchCalendarEvents = async () => {
		try {
			console.log("🎯 fetchCalendarEvents() called");
			const result = await calendarClient.getEvents();

			// Convert to FullCalendar format
			const fullCalendarEvents = result.events.map((event) => ({
				id: event.id,
				title: event.title,
				start: event.startTime,
				end: event.endTime,
				allDay: event.allDay,
				color: getEventColor(event.provider), // Color based on provider
				extendedProps: {
					description: event.description,
					location: event.location,
					provider: event.provider,
					calendarName: event.calendarName,
				},
			}));

			// Update events in parent component
			onEventsLoaded(fullCalendarEvents);

			return fullCalendarEvents;
		} catch (err: any) {
			console.error("Error fetching events:", err);
			return [];
		}
	};

	// Get color based on provider
	const getEventColor = (provider: string): string => {
		switch (provider) {
			case CalendarProvider.GOOGLE:
				return "#4285F4"; // Google blue
			case CalendarProvider.MICROSOFT:
				return "#00A4EF"; // Microsoft blue
			case CalendarProvider.APPLE:
				return "#A2AAAD"; // Apple silver
			case CalendarProvider.EXCHANGE:
				return "#0078D4"; // Exchange blue
			default:
				return "#6941C6"; // Default purple
		}
	};

	// Helper function to handle OAuth flow with popup
	const handleOAuthPopup = (provider: CalendarProvider): Promise<void> => {
		return new Promise((resolve, reject) => {
			setIsLoading(true);
			setSyncError("");

			// Generate the authorization URL
			calendarClient
				.getAuthUrl(provider)
				.then((authUrl) => {
					// Open a centered popup window with the OAuth URL
					const width = 600;
					const height = 700;
					const left = window.screenX + (window.outerWidth - width) / 2;
					const top = window.screenY + (window.outerHeight - height) / 2.5;

					// Make sure the authUrl is absolute
					const fullAuthUrl = authUrl.startsWith("http") ? authUrl : `${window.location.origin}${authUrl}`;

					// Our API will handle the OAuth flow and redirect back to our callback
					const popup = window.open(
						fullAuthUrl,
						`${provider} OAuth`,
						`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
					);

					if (!popup) {
						const error = new Error("Popup blocked. Please allow popups for this site.");
						setIsLoading(false);
						setSyncError(error.message);
						reject(error);
						return;
					}

					let authCompleted = false;

					// Listen for messages from the popup
					const messageHandler = (event: MessageEvent) => {
						try {
							// Verify the origin for security
							if (event.origin !== window.location.origin) return;

							if (event.data.type === "oauth-success") {
								authCompleted = true;
								console.log("OAuth success received:", event.data);

								// Store the token
								if (event.data.token) {
									try {
										const tokenData = typeof event.data.token === "string" ? JSON.parse(event.data.token) : event.data.token;

										console.log("Parsed token data:", tokenData);

										// Store credentials in the CalendarClient
										calendarClient.handleOAuthSuccess(provider, tokenData);
										console.log("Credentials stored in CalendarClient for provider:", provider);

										// Update the auth state based on the provider
										switch (provider) {
											case CalendarProvider.GOOGLE:
												setGoogleAuth(true);
												console.log("Google auth state updated to true");
												break;
											case CalendarProvider.MICROSOFT:
												setMicrosoftAuth(true);
												console.log("Microsoft auth state updated to true");
												break;
											case CalendarProvider.APPLE:
												setAppleAuth(true);
												console.log("Apple auth state updated to true");
												break;
											case CalendarProvider.EXCHANGE:
												setExchangeAuth(true);
												console.log("Exchange auth state updated to true");
												break;
										}

										// Reload to update the UI with the new auth state
										setTimeout(() => {
											window.location.reload();
										}, 100);
									} catch (e) {
										console.error("Error parsing token or storing credentials:", e);
										setSyncError("Failed to store authentication credentials");
										cleanup();
										reject(e);
										return;
									}
								}

								// Close the popup if it's still open
								if (popup && !popup.closed) {
									try {
										popup.close();
									} catch (e) {
										console.error("Error closing popup:", e);
									}
								}

								// Clean up and resolve
								cleanup();
								resolve();

								// Reload to update the UI with the new auth state
								setTimeout(() => {
									window.location.reload();
								}, 100);
							} else if (event.data.type === "oauth-error") {
								authCompleted = true;
								const errorMessage = event.data.error || "Authentication failed";
								console.error("OAuth error received:", errorMessage);
								setSyncError(`Authentication failed: ${errorMessage}`);

								// Close the popup if it's still open
								if (popup && !popup.closed) {
									try {
										popup.close();
									} catch (e) {
										console.error("Error closing popup:", e);
									}
								}

								cleanup();
								reject(new Error(errorMessage));
							}
						} catch (e) {
							console.error("Error in message handler:", e);
							setSyncError("An error occurred during authentication");
							cleanup();
							reject(e);
						}
					};

					// Add the event listener
					window.addEventListener("message", messageHandler);

					// Cleanup function
					const cleanup = () => {
						try {
							clearInterval(checkPopup);
							window.removeEventListener("message", messageHandler);
							setIsLoading(false);
						} catch (e) {
							console.error("Error during cleanup:", e);
						}
					};

					// Poll to check if popup is closed by user
					const checkPopup = setInterval(() => {
						try {
							if (popup.closed) {
								if (!authCompleted) {
									setSyncError("Authentication was cancelled or the popup was closed");
									reject(new Error("Authentication popup was closed"));
								}
								cleanup();
							}
						} catch (e) {
							console.error("Error checking popup status:", e);
							cleanup();
							reject(e);
						}
					}, 500);

					// Set up cleanup on component unmount
					return () => {
						cleanup();
					};
				})
				.catch((error) => {
					setIsLoading(false);
					setSyncError(error.message || "Failed to start authentication");
					reject(error);
				});
		});
	};

	// Authentication handlers
	const authenticateGoogle = () => handleOAuthPopup(CalendarProvider.GOOGLE);
	const authenticateMicrosoft = () => handleOAuthPopup(CalendarProvider.MICROSOFT);

	const authenticateApple = async () => {
		try {
			const authUrl = await calendarClient.getAuthUrl(CalendarProvider.APPLE);
			// Add provider to the URL for the callback
			const url = new URL(authUrl);
			url.searchParams.append("provider", CalendarProvider.APPLE);
			window.location.href = url.toString();
		} catch (err: any) {
			setSyncError("Apple authentication failed: " + err.message);
		}
	};

	const authenticateExchange = async () => {
		try {
			const authUrl = await calendarClient.getAuthUrl(CalendarProvider.EXCHANGE);
			// Add provider to the URL for the callback
			const url = new URL(authUrl);
			url.searchParams.append("provider", CalendarProvider.EXCHANGE);
			window.location.href = url.toString();
		} catch (err: any) {
			setSyncError("Exchange authentication failed: " + err.message);
		}
	};

	// Run calendar sync
	const syncCalendars = async () => {
		try {
			setSyncStatus("syncing");
			setSyncError(null);

			const result = await calendarClient.runSync();

			if (result.status === "completed") {
				setSyncStatus("success");
				setLastSync(new Date().toLocaleString());

				// Refresh events
				await fetchCalendarEvents();
			} else {
				setSyncStatus("error");
				setSyncError(`Sync failed: ${result.errors?.join(", ")}`);
			}
		} catch (err: any) {
			setSyncStatus("error");
			setSyncError(`Sync failed: ${err.message}`);
		}
	};

	// Configure a new destination calendar
	const configureDestination = async (provider: string) => {
		try {
			if (!googleAuth && !microsoftAuth && !appleAuth && !exchangeAuth) {
				setSyncError("Please authenticate with at least one calendar provider first");
				return;
			}

			// For simplicity, we'll use the first available provider
			const providerToUse =
				provider ||
				(googleAuth
					? CalendarProvider.GOOGLE
					: microsoftAuth
						? CalendarProvider.MICROSOFT
						: appleAuth
							? CalendarProvider.APPLE
							: CalendarProvider.EXCHANGE);

			// Get calendars for this provider
			const calendarsResult = await calendarClient.listCalendars();
			const providerCalendars = calendarsResult[providerToUse] || [];

			if (providerCalendars.length === 0) {
				setSyncError(`No calendars found for ${providerToUse}`);
				return;
			}

			// Use the first calendar (usually primary) as destination
			const primaryCalendar = providerCalendars.find((cal) => cal.primary || cal.isDefaultCalendar) || providerCalendars[0];

			// Create destination configuration
			const destination: SyncDestination = {
				id: `destination_${Date.now()}`,
				name: primaryCalendar.summary || primaryCalendar.name || "Calendar Hub",
				providerType: providerToUse,
				connectionInfo: {},
				credentials: calendarClient["credentials"][providerToUse],
				calendarId: primaryCalendar.id,
				conflictResolution: "latest_wins",
				categories: {},
				sourceCalendars: {},
				colorManagement: "separate_calendar",
			};

			// Configure the destination
			await calendarClient.configureDestination(destination);

			// Add other providers as sources
			const providers = [
				googleAuth && providerToUse !== CalendarProvider.GOOGLE ? CalendarProvider.GOOGLE : null,
				microsoftAuth && providerToUse !== CalendarProvider.MICROSOFT ? CalendarProvider.MICROSOFT : null,
				appleAuth && providerToUse !== CalendarProvider.APPLE ? CalendarProvider.APPLE : null,
				exchangeAuth && providerToUse !== CalendarProvider.EXCHANGE ? CalendarProvider.EXCHANGE : null,
			].filter(Boolean) as string[];

			// Add each provider as a source
			for (const provider of providers) {
				const providerCalendars = calendarsResult[provider] || [];
				if (providerCalendars.length > 0) {
					const source = {
						id: `source_${provider}_${Date.now()}`,
						name: `${provider} Calendar`,
						providerType: provider,
						connectionInfo: {},
						credentials: calendarClient["credentials"][provider],
						syncDirection: "read_only" as const,
						syncFrequency: "hourly" as const,
						syncMethod: "api" as const,
						calendars: providerCalendars.map((cal) => cal.id),
						syncTokens: {},
						enabled: true,
					};

					await calendarClient.addSyncSource(source);
				}
			}

			setSyncConfigured(true);
			await syncCalendars();
		} catch (err: any) {
			setSyncError(`Failed to configure calendar sync: ${err.message}`);
		}
	};

	return (
		<>
			<div className="flex items-center space-x-2">
				{syncConfigured ? (
					<Button onClick={syncCalendars} variant="outline" size="sm" disabled={syncStatus === "syncing"} className="gap-2">
						<RefreshCw className={`h-4 w-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
						{syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
					</Button>
				) : (
					<Button
						onClick={() => configureDestination(googleAuth ? CalendarProvider.GOOGLE : CalendarProvider.MICROSOFT)}
						variant="outline"
						size="sm"
						className="gap-2">
						<Calendar className="h-4 w-4" />
						Setup Sync
					</Button>
				)}

				<Dialog>
					<DialogTrigger asChild>
						<Button variant="ghost" size="sm" className="gap-2">
							<Settings className="h-4 w-4" />
							Settings
						</Button>
					</DialogTrigger>
					<DialogContent
						style={{
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							maxHeight: "90vh",
							width: "90%",
							maxWidth: "32rem",
							overflowY: "auto",
							zIndex: 50,
						}}
						className="bg-background rounded-lg shadow-lg p-6">
						<DialogHeader>
							<DialogTitle>Calendar Settings</DialogTitle>
						</DialogHeader>

						<Tabs defaultValue="accounts">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="accounts">Accounts</TabsTrigger>
								<TabsTrigger value="sources">Sources</TabsTrigger>
								<TabsTrigger value="agents">Remote Agents</TabsTrigger>
								<TabsTrigger value="sync">Sync</TabsTrigger>
							</TabsList>

							<TabsContent value="accounts" className="mt-4">
								<div className="space-y-3">
									<Button onClick={authenticateGoogle} variant={googleAuth ? "outline" : "default"} className="w-full justify-start gap-2">
										{googleAuth ? "✓ Google Connected" : "Connect Google Calendar"}
									</Button>

									<Button
										onClick={authenticateMicrosoft}
										variant={microsoftAuth ? "outline" : "default"}
										className="w-full justify-start gap-2">
										{microsoftAuth ? "✓ Microsoft Connected" : "Connect Microsoft Calendar"}
									</Button>

									<Button onClick={authenticateApple} variant={appleAuth ? "outline" : "default"} className="w-full justify-start gap-2">
										{appleAuth ? "✓ Apple Connected" : "Connect Apple Calendar"}
									</Button>

									<Button
										onClick={authenticateExchange}
										variant={exchangeAuth ? "outline" : "default"}
										className="w-full justify-start gap-2">
										{exchangeAuth ? "✓ Exchange Connected" : "Connect Exchange Calendar"}
									</Button>
								</div>
							</TabsContent>

							<TabsContent value="sources" className="mt-4">
								<SourceManagementComponent calendarClient={calendarClient} />
							</TabsContent>

							<TabsContent value="agents" className="mt-4">
								<RemoteAgentStatusComponent calendarClient={calendarClient} />
							</TabsContent>

							<TabsContent value="sync" className="mt-4">
								<div className="space-y-4">
									<div className="space-y-2">
										<h4 className="font-medium">Sync Status</h4>
										<div className="text-sm">
											{syncConfigured ? (
												<p className="text-green-600 dark:text-green-400">Calendar sync is configured</p>
											) : (
												<p className="text-amber-600 dark:text-amber-400">Calendar sync is not configured</p>
											)}

											{lastSync && <p className="text-gray-600 dark:text-gray-400 mt-1">Last sync: {lastSync}</p>}

											{syncError && <p className="text-red-600 dark:text-red-400 mt-1">{syncError}</p>}
										</div>
									</div>

									<div className="space-y-2">
										{syncConfigured ? (
											<Button onClick={syncCalendars} className="w-full" disabled={syncStatus === "syncing"}>
												{syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
											</Button>
										) : (
											<>
												<Button
													onClick={() => configureDestination(CalendarProvider.GOOGLE)}
													className="w-full mb-2"
													disabled={!googleAuth}>
													Use Google as Master
												</Button>

												<Button
													onClick={() => configureDestination(CalendarProvider.MICROSOFT)}
													className="w-full"
													disabled={!microsoftAuth}>
													Use Microsoft as Master
												</Button>
											</>
										)}
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</DialogContent>
				</Dialog>
			</div>

			{/* Status indicator */}
			{syncStatus === "error" && syncError && <div className="text-sm text-red-600 dark:text-red-400 mt-2">{syncError}</div>}

			{syncStatus === "success" && <div className="text-sm text-green-600 dark:text-green-400 mt-2">Sync completed successfully</div>}
		</>
	);
}
