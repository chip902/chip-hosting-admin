export enum CalendarProvider {
  GOOGLE = "google",
  MICROSOFT = "microsoft",
  APPLE = "apple",
  EXCHANGE = "exchange", // For Mailcow ActiveSync
}

export interface CalendarCredentials {
  token_type: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  tenant_id?: string; // For Microsoft only
}

export interface EventParticipant {
  email?: string;
  name?: string;
  responseStatus?: string;
}

export interface CalendarEvent {
  id: string;
  provider: CalendarProvider;
  providerId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  allDay: boolean;
  organizer?: EventParticipant;
  participants: EventParticipant[];
  recurring: boolean;
  recurrencePattern?: string;
  calendarId: string;
  calendarName?: string;
  link?: string;
  private: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarInfo {
  id: string;
  summary?: string; // Google
  name?: string; // Microsoft
  description?: string;
  location?: string;
  timeZone?: string;
  accessRole?: string;
  primary?: boolean; // Google
  isDefaultCalendar?: boolean; // Microsoft
  color?: string;
  hexColor?: string;
}

export interface SyncSource {
  id: string;
  name: string;
  providerType: string;
  connectionInfo: Record<string, any>;
  credentials?: Record<string, any>;
  syncDirection: "read_only" | "write_only" | "bidirectional";
  syncFrequency: "real_time" | "hourly" | "daily" | "manual";
  syncMethod: "api" | "agent" | "file" | "email";
  calendars: string[];
  lastSync?: string;
  syncTokens: Record<string, string>;
  enabled: boolean;
}

export interface SyncDestination {
  id: string;
  name: string;
  providerType: string;
  connectionInfo: Record<string, any>;
  credentials?: Record<string, any>;
  calendarId: string;
  conflictResolution: "source_wins" | "destination_wins" | "latest_wins" | "manual";
  categories: Record<string, string>;
  // New fields for color management
  sourceCalendars?: Record<string, string>;
  colorManagement?: "category" | "property" | "separate_calendar";
}

export interface SyncConfiguration {
  sources: SyncSource[];
  destination: SyncDestination;
  agents: any[]; // Not typically managed from client side
  globalSettings: Record<string, any>;
}

export interface SyncResult {
  status: string;
  sourcesSync?: number;
  eventsSync?: number;
  errors: string[];
  startTime: string;
  endTime?: string;
}

export interface RemoteAgent {
  id: string;
  name: string;
  environment: string;
  agent_type: string;
  communication_method: string;
  api_endpoint?: string;
  interval_minutes: number;
  sources: SyncSource[];
  last_heartbeat?: string;
  status: "active" | "inactive" | "error" | "unknown";
  created_at: string;
  updated_at?: string;
}

export interface RemoteAgentStatus {
  agent_id: string;
  status: "active" | "inactive" | "error" | "unknown";
  last_heartbeat: string;
  heartbeat_count: number;
  last_events_count?: number;
  environment: string;
  uptime?: number;
  error_message?: string;
  recent_heartbeats: AgentHeartbeat[];
}

export interface AgentHeartbeat {
  timestamp: string;
  status: string;
  environment: string;
  events_count?: number;
  error_message?: string;
}
