/**
 * Calendar Microservice Client for Next.js Applications
 *
 * This client provides a simple interface for integrating with the Calendar Microservice
 * from a Next.js application. It handles authentication, event fetching, and synchronization.
 */

import {
	CalendarProvider,
	CalendarCredentials,
	CalendarInfo,
	CalendarEvent,
	SyncConfiguration,
	SyncDestination,
	SyncSource,
	SyncResult,
	RemoteAgent,
	RemoteAgentStatus,
} from "@/types/calendar";
import axios, { AxiosInstance } from "axios";

// Main Calendar Client
export class CalendarClient {
	private api: AxiosInstance;
	private credentials: Record<string, CalendarCredentials> = {};
	private calendarSelections: Record<string, string[]> = {};
	private syncTokens: Record<string, Record<string, string>> = {
		[CalendarProvider.GOOGLE]: {},
		[CalendarProvider.MICROSOFT]: {},
		[CalendarProvider.APPLE]: {},
		[CalendarProvider.EXCHANGE]: {},
	};

	/**
	 * Create a new Calendar Client instance
	 *
	 * @param baseURL The base URL of the Calendar Microservice
	 */
	constructor(baseURL: string = "") {
		// Use the master sync server URL from environment variables if no baseURL is provided
		let apiBaseURL = baseURL || process.env.NEXT_PUBLIC_CALENDAR_MICROSERVICE_URL || "";

		// Ensure the base URL doesn't end with a slash to avoid double slashes
		if (apiBaseURL.endsWith("/")) {
			apiBaseURL = apiBaseURL.slice(0, -1);
		}

		const isCrossOrigin = apiBaseURL && typeof window !== 'undefined' && !apiBaseURL.startsWith(window.location.origin);

		this.api = axios.create({
			baseURL: apiBaseURL,
			timeout: 30000, // 30 seconds
			withCredentials: !isCrossOrigin, // Only send credentials for same-origin requests
		});

		// Add CORS headers for cross-origin requests
		if (isCrossOrigin && typeof window !== 'undefined') {
			this.api.defaults.headers.common["Access-Control-Allow-Origin"] = window.location.origin;
			this.api.defaults.headers.common["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
			this.api.defaults.headers.common["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
		}

		// Add request interceptor for logging
		this.api.interceptors.request.use(
			(config) => {
				console.log("Request:", config.method?.toUpperCase(), config.url);
				return config;
			},
			(error) => {
				console.error("Request Error:", error);
				return Promise.reject(error);
			}
		);

		// Add response interceptor for error handling
		this.api.interceptors.response.use(
			(response) => response,
			(error) => {
				if (error.response) {
					console.error("Response Error:", {
						status: error.response.status,
						data: error.response.data,
						headers: error.response.headers,
					});
				} else if (error.request) {
					console.error("No response received:", error.request);
				} else {
					console.error("Request setup error:", error.message);
				}
				return Promise.reject(error);
			}
		);
	}

	/**
	 * Set provider credentials
	 *
	 * @param provider The calendar provider (GOOGLE or MICROSOFT)
	 * @param credentials The OAuth credentials
	 */
	public setCredentials(provider: CalendarProvider, credentials: CalendarCredentials): void {
		this.credentials[provider] = credentials;
	}

	/**
	 * Get authentication URL for a calendar provider
	 *
	 * @param provider The calendar provider to authenticate with
	 * @param tenantId Optional tenant ID for Microsoft authentication
	 * @returns Authentication URL to redirect the user to
	 */
	public async getAuthUrl(provider: CalendarProvider, tenantId?: string): Promise<string> {
		try {
			// Use our Next.js API route which will proxy the request to the calendar service
			const endpoint = `/api/calendar/auth/${provider.toLowerCase()}`;
			const params = new URLSearchParams();

			// Add the final redirect_uri that the calendar service should redirect to after auth
			// This will be handled by our Next.js API route
			const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/calendar/auth/callback` : "";

			if (redirectUri) {
				params.append("redirect_uri", redirectUri);
			}

			// Create a more robust state parameter that includes provider info
			let stateParam = provider.toLowerCase();
			if (tenantId) {
				stateParam = `${provider.toLowerCase()}_${tenantId}`;
			} else {
				// Add a random identifier to prevent CSRF attacks
				const randomId = Math.random().toString(36).substring(2, 15);
				stateParam = `${provider.toLowerCase()}_${randomId}`;
			}

			params.append("state", stateParam);

			// Return the URL to our API route which will handle the OAuth flow
			const authUrl = `${endpoint}?${params.toString()}`;
			console.log("Generated auth URL:", authUrl);
			return authUrl;
		} catch (error: any) {
			console.error(`Error generating auth URL for ${provider}:`, error);
			throw new Error(`Failed to generate auth URL: ${error.message}`);
		}
	}

	/**
	 * Exchange authentication code for OAuth tokens
	 *
	 * @param provider The calendar provider
	 * @param code The authorization code
	 * @param state Optional state/tenant ID from the OAuth flow
	 * @returns The OAuth credentials
	 */
	public async exchangeAuthCode(provider: CalendarProvider, code: string, state?: string): Promise<CalendarCredentials> {
		try {
			// Use the direct endpoint that matches the server's expected path
			const endpoint = `/api/auth/${provider.toLowerCase()}/callback`;
			const params = new URLSearchParams();
			params.append("code", code);
			if (state) {
				params.append("state", state);
			}

			console.log(`Exchanging auth code at: ${endpoint}?${params.toString()}`);
			const response = await this.api.get(`${endpoint}?${params.toString()}`);

			if (!response.data) {
				throw new Error("No data received from authentication server");
			}

			// The response should contain the tokens directly from the OAuth provider
			const credentials: CalendarCredentials = {
				token_type: response.data.token_type || "Bearer",
				access_token: response.data.access_token,
				refresh_token: response.data.refresh_token,
				expires_at: response.data.expires_at || Date.now() / 1000 + (response.data.expires_in || 3600),
			};

			// Store the credentials
			this.setCredentials(provider, credentials);

			return credentials;
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || error.message;
			console.error(`Error exchanging auth code for ${provider}:`, errorMessage);
			throw new Error(`Failed to exchange auth code: ${errorMessage}`);
		}
	}

	/**
	 * List available calendars for authenticated providers
	 *
	 * @returns Object mapping provider names to lists of calendars
	 */
	public async listCalendars(): Promise<Record<string, CalendarInfo[]>> {
		try {
			const response = await this.api.get("/calendars");
			return response.data || {};
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || error.message;
			console.error("Error listing calendars:", errorMessage);
			throw new Error(`Failed to list calendars: ${errorMessage}`);
		}
	}

	/**
	 * Set calendar selections for fetching events
	 *
	 * @param selections Object mapping provider names to lists of calendar IDs
	 */
	public setCalendarSelections(selections: Record<string, string[]>): void {
		this.calendarSelections = selections;
	}

	/**
	 * Fetch events from selected calendars
	 *
	 * @param startDate Optional start date for the event range
	 * @param endDate Optional end date for the event range
	 * @returns Object with events and sync tokens
	 */
	public async getEvents(startDate?: Date, endDate?: Date): Promise<{ events: CalendarEvent[]; syncTokens: Record<string, Record<string, string>> }> {
		try {
			console.log("🔍 CalendarClient.getEvents() called");
			console.log("📋 Current credentials:", Object.keys(this.credentials));
			console.log("📅 Current calendar selections:", this.calendarSelections);

			// Prepare query parameters
			const params: Record<string, string> = {};

			// Add credentials if available
			if (Object.keys(this.credentials).length > 0) {
				params.credentials = JSON.stringify(this.credentials);
				console.log("✅ Added credentials to params");
			} else {
				console.log("❌ No credentials available");
			}

			// Add calendar selections if available
			if (Object.keys(this.calendarSelections).length > 0) {
				params.calendars = JSON.stringify(this.calendarSelections);
				console.log("✅ Added calendar selections to params");
			} else {
				console.log("❌ No calendar selections available - will fetch from all calendars");
			}

			// Add sync tokens if available
			if (Object.keys(this.syncTokens).length > 0) {
				params.sync_tokens = JSON.stringify(this.syncTokens);
			}

			// Add date parameters if provided
			if (startDate) {
				params.start = startDate.toISOString();
			}

			if (endDate) {
				params.end = endDate.toISOString();
			}

			// Make API call
			console.log("🚀 Making API call to /events with params:", params);
			const response = await this.api.get("/events", { params });
			console.log("✅ Events API response status:", response.status);
			console.log("📊 Events received:", response.data?.events?.length || 0);

			if (!response.data) {
				throw new Error("No data received from events endpoint");
			}

			// Update sync tokens for next request
			if (response.data.syncTokens) {
				this.syncTokens = response.data.syncTokens;
			}

			// Convert snake_case to camelCase for event properties
			const events: CalendarEvent[] = Array.isArray(response.data.events)
				? response.data.events.map((event: any) => ({
						id: event.id || "",
						provider: event.provider || "",
						providerId: event.provider_id || "",
						title: event.title || "No Title",
						description: event.description || "",
						location: event.location || "",
						startTime: event.start_time || new Date().toISOString(),
						endTime: event.end_time || new Date().toISOString(),
						allDay: event.all_day || false,
						organizer: event.organizer || {},
						participants: Array.isArray(event.participants) ? event.participants : [],
						recurring: event.recurring || false,
						recurrencePattern: event.recurrence_pattern || "",
						calendarId: event.calendar_id || "",
						calendarName: event.calendar_name || "",
						link: event.link || "",
						private: event.private || false,
						status: event.status || "confirmed",
						createdAt: event.created_at || new Date().toISOString(),
				  }))
				: [];

			return {
				events,
				syncTokens: this.syncTokens,
			};
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || error.message;
			console.error("Error fetching events:", errorMessage);
			throw new Error(`Failed to fetch events: ${errorMessage}`);
		}
	}

	/**
	 * Get the current synchronization configuration
	 */
	public async getSyncConfiguration(): Promise<SyncConfiguration> {
		try {
			const response = await this.api.get("/sync/config");
			return response.data || { sources: [], destination: null, agents: [], globalSettings: {} };
		} catch (error: any) {
			console.error("Error getting sync configuration:", error.response?.data || error.message);
			// Return a default configuration when there's an error
			return {
				sources: [],
				destination: {
					id: "",
					name: "",
					providerType: "",
					connectionInfo: { provider: "", calendarId: "" },
					calendarId: "",
					conflictResolution: "manual",
					categories: {},
				},
				agents: [],
				globalSettings: {},
			};
		}
	}

	/**
	 * Configure the destination calendar for synchronization
	 */
	public async configureDestination(destination: SyncDestination): Promise<SyncDestination> {
		try {
			const response = await this.api.post("/sync/config/destination", destination);
			return response.data;
		} catch (error: any) {
			console.error("Error configuring destination:", error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Add a new synchronization source
	 */
	public async addSyncSource(source: SyncSource): Promise<SyncSource> {
		try {
			const response = await this.api.post("/sync/sources", source);
			return response.data;
		} catch (error: any) {
			console.error("Error adding sync source:", error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Update an existing synchronization source
	 */
	public async updateSyncSource(sourceId: string, updates: Partial<SyncSource>): Promise<SyncSource> {
		try {
			const response = await this.api.put(`/sync/sources/${sourceId}`, updates);
			return response.data;
		} catch (error: any) {
			console.error("Error updating sync source:", error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Delete a synchronization source
	 */
	public async deleteSyncSource(sourceId: string): Promise<void> {
		try {
			await this.api.delete(`/sync/sources/${sourceId}`);
		} catch (error: any) {
			console.error(`Error deleting sync source ${sourceId}:`, error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Remove a synchronization source
	 */
	public async removeSyncSource(sourceId: string): Promise<{ status: string; message: string }> {
		try {
			const response = await this.api.delete(`/sync/sources/${sourceId}`);
			return response.data;
		} catch (error: any) {
			console.error("Error removing sync source:", error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Run synchronization for all sources
	 */
	public async runSync(): Promise<SyncResult> {
		try {
			const response = await this.api.post("/sync/run");
			return response.data;
		} catch (error: any) {
			console.error("Error running sync:", error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Run synchronization for a single source
	 */
	public async runSourceSync(sourceId: string): Promise<SyncResult> {
		try {
			const response = await this.api.post(`/sync/run/${sourceId}`);
			return response.data;
		} catch (error: any) {
			console.error(`Error running sync for source ${sourceId}:`, error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Get remote agents
	 */
	public async getRemoteAgents(): Promise<RemoteAgent[]> {
		try {
			const response = await this.api.get("/sync/agents");
			return response.data;
		} catch (error: any) {
			console.error("Error fetching remote agents:", error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Get remote agent by ID
	 */
	public async getRemoteAgent(agentId: string): Promise<RemoteAgent> {
		try {
			const response = await this.api.get(`/sync/agents/${agentId}`);
			return response.data;
		} catch (error: any) {
			console.error(`Error fetching remote agent ${agentId}:`, error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Get remote agent status and recent heartbeats
	 */
	public async getRemoteAgentStatus(agentId: string): Promise<RemoteAgentStatus> {
		try {
			const response = await this.api.get(`/sync/agents/${agentId}/status`);
			return response.data;
		} catch (error: any) {
			console.error(`Error fetching agent status for ${agentId}:`, error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Register a new remote agent (for manual registration)
	 */
	public async registerRemoteAgent(agentData: Partial<RemoteAgent>): Promise<RemoteAgent> {
		try {
			const response = await this.api.post("/sync/agents", agentData);
			return response.data;
		} catch (error: any) {
			console.error("Error registering remote agent:", error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Delete a remote agent
	 */
	public async deleteRemoteAgent(agentId: string): Promise<void> {
		try {
			await this.api.delete(`/sync/agents/${agentId}`);
		} catch (error: any) {
			console.error(`Error deleting remote agent ${agentId}:`, error.response?.data || error.message);
			throw error;
		}
	}

	/**
	 * Handle OAuth completion and store credentials
	 *
	 * @param provider The calendar provider
	 * @param tokenData The token data received from OAuth
	 */
	public handleOAuthSuccess(provider: CalendarProvider, tokenData: any): void {
		try {
			// Store the credentials in the client
			this.credentials[provider] = {
				access_token: tokenData.access_token,
				refresh_token: tokenData.refresh_token,
				expires_at: tokenData.expires_at || (tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined),
				token_type: tokenData.token_type || "Bearer",
				tenant_id: tokenData.tenant_id,
			};

			// Log successful authentication
			console.log(`Successfully authenticated with ${provider}`);
		} catch (error: any) {
			console.error(`Error storing credentials for ${provider}:`, error);
			throw new Error(`Failed to store OAuth credentials: ${error.message}`);
		}
	}

	/**
	 * Check if a provider is authenticated
	 *
	 * @param provider The calendar provider to check
	 * @returns True if the provider has valid credentials
	 */
	public isAuthenticated(provider: CalendarProvider): boolean {
		const credentials = this.credentials[provider];
		return !!(credentials && credentials.access_token);
	}

	/**
	 * Get stored credentials for a provider
	 *
	 * @param provider The calendar provider
	 * @returns The stored credentials or null if not found
	 */
	public getCredentials(provider: CalendarProvider): CalendarCredentials | null {
		return this.credentials[provider] || null;
	}

	/**
	 * Remove stored credentials for a provider
	 *
	 * @param provider The calendar provider
	 */
	public clearCredentials(provider: CalendarProvider): void {
		delete this.credentials[provider];
		console.log(`Cleared credentials for ${provider}`);
	}

	/**
	 * Check if credentials are expired
	 *
	 * @param provider The calendar provider
	 * @returns True if credentials are expired or about to expire
	 */
	public isCredentialsExpired(provider: CalendarProvider): boolean {
		const credentials = this.credentials[provider];
		if (!credentials || !credentials.expires_at) {
			return false; // No expiry info available
		}

		// Consider expired if expiring within the next 5 minutes
		const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
		return Date.now() + bufferTime >= credentials.expires_at;
	}

	/**
	 * Get all authenticated providers
	 *
	 * @returns Array of authenticated calendar providers
	 */
	public getAuthenticatedProviders(): CalendarProvider[] {
		return Object.keys(this.credentials)
			.filter((provider) => this.isAuthenticated(provider as CalendarProvider))
			.map((provider) => provider as CalendarProvider);
	}
}
