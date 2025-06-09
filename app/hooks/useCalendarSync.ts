'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

// Types
interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive';
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

interface SyncConfiguration {
  sources: any[];
  agents: any[];
  destination: Destination | null;
}

// API Client
class CalendarSyncAPI {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://chepurny.com:8008') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Agent Management
  async getAgentStatus(): Promise<{ agent_status: Record<string, Agent> }> {
    return this.request('/sync/agents/status');
  }

  async getAgentDetails(agentId: string): Promise<Agent> {
    return this.request(`/sync/agents/${agentId}/status`);
  }

  // Sync Statistics
  async getSyncStats(): Promise<SyncStats> {
    return this.request('/sync/stats');
  }

  // Configuration
  async getConfiguration(): Promise<SyncConfiguration> {
    return this.request('/sync/config');
  }

  // Google Calendar Setup
  async getGoogleAuthUrl(): Promise<{ auth_url: string; instructions: string }> {
    return this.request('/sync/config/google/auth-url');
  }

  async exchangeGoogleCode(code: string): Promise<{ status: string; credentials: GoogleCredentials }> {
    return this.request('/sync/config/google/exchange-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getGoogleCalendars(credentials: GoogleCredentials): Promise<{ calendars: any[]; total_count: number }> {
    return this.request('/sync/config/google/calendars', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async configureGoogleDestination(calendarId: string, credentials: GoogleCredentials): Promise<any> {
    return this.request('/sync/config/destination/google', {
      method: 'POST',
      body: JSON.stringify({
        calendar_id: calendarId,
        credentials,
      }),
    });
  }

  // Sync Operations
  async triggerSync(): Promise<any> {
    return this.request('/sync/run', { method: 'POST' });
  }

  async testEndToEndSync(): Promise<any> {
    return this.request('/sync/test/end-to-end', { method: 'POST' });
  }

  async syncSingleSource(sourceId: string): Promise<any> {
    return this.request(`/sync/run/${sourceId}`, { method: 'POST' });
  }
}

// Singleton API instance
const api = new CalendarSyncAPI();

// Custom Hooks
export function useCalendarSync() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: agents = {},
    isLoading: agentsLoading,
    error: agentsError,
    refetch: refetchAgents,
  } = useQuery({
    queryKey: ['calendar-agents'],
    queryFn: async () => {
      const data = await api.getAgentStatus();
      return data.agent_status || {};
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const {
    data: syncStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['sync-stats'],
    queryFn: () => api.getSyncStats(),
    refetchInterval: 30000,
  });

  const {
    data: configuration,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['sync-config'],
    queryFn: () => api.getConfiguration(),
  });

  // Mutations
  const triggerSyncMutation = useMutation({
    mutationFn: () => api.triggerSync(),
    onSuccess: () => {
      // Refresh stats after sync
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
        queryClient.invalidateQueries({ queryKey: ['calendar-agents'] });
      }, 2000);
    },
  });

  const testSyncMutation = useMutation({
    mutationFn: () => api.testEndToEndSync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
    },
  });

  const configureDestinationMutation = useMutation({
    mutationFn: ({ calendarId, credentials }: { calendarId: string; credentials: GoogleCredentials }) =>
      api.configureGoogleDestination(calendarId, credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-config'] });
    },
  });

  // Helper functions
  const refreshAll = () => {
    refetchAgents();
    refetchStats();
    refetchConfig();
  };

  const isLoading = agentsLoading || statsLoading || configLoading;
  const hasErrors = agentsError || statsError || configError;

  return {
    // Data
    agents,
    syncStats,
    destination: configuration?.destination || null,
    configuration,

    // Loading states
    isLoading,
    agentsLoading,
    statsLoading,
    configLoading,

    // Errors
    hasErrors,
    agentsError,
    statsError,
    configError,

    // Actions
    triggerSync: triggerSyncMutation.mutate,
    testSync: testSyncMutation.mutate,
    configureDestination: configureDestinationMutation.mutate,
    refreshAll,
    refetchAgents,
    refetchStats,
    refetchConfig,

    // Mutation states
    isSyncing: triggerSyncMutation.isPending,
    isTesting: testSyncMutation.isPending,
    isConfiguringDestination: configureDestinationMutation.isPending,
  };
}

// Google Calendar Setup Hook
export function useGoogleCalendarSetup() {
  const [authUrl, setAuthUrl] = useState('');
  const [credentials, setCredentials] = useState<GoogleCredentials | null>(null);
  const [availableCalendars, setAvailableCalendars] = useState<any[]>([]);

  const getAuthUrlMutation = useMutation({
    mutationFn: () => api.getGoogleAuthUrl(),
    onSuccess: (data) => {
      setAuthUrl(data.auth_url);
    },
  });

  const exchangeCodeMutation = useMutation({
    mutationFn: (code: string) => api.exchangeGoogleCode(code),
    onSuccess: (data) => {
      setCredentials(data.credentials);
      // Automatically load calendars after successful auth
      loadCalendarsMutation.mutate(data.credentials);
    },
  });

  const loadCalendarsMutation = useMutation({
    mutationFn: (creds: GoogleCredentials) => api.getGoogleCalendars(creds),
    onSuccess: (data) => {
      setAvailableCalendars(data.calendars || []);
    },
  });

  return {
    // State
    authUrl,
    credentials,
    availableCalendars,

    // Actions
    getAuthUrl: getAuthUrlMutation.mutate,
    exchangeCode: exchangeCodeMutation.mutate,
    loadCalendars: loadCalendarsMutation.mutate,

    // Loading states
    isGettingAuthUrl: getAuthUrlMutation.isPending,
    isExchangingCode: exchangeCodeMutation.isPending,
    isLoadingCalendars: loadCalendarsMutation.isPending,

    // Errors
    authUrlError: getAuthUrlMutation.error,
    exchangeError: exchangeCodeMutation.error,
    calendarsError: loadCalendarsMutation.error,

    // Reset
    reset: () => {
      setAuthUrl('');
      setCredentials(null);
      setAvailableCalendars([]);
    },
  };
}

// Agent Details Hook
export function useAgentDetails(agentId: string) {
  return useQuery({
    queryKey: ['agent-details', agentId],
    queryFn: () => api.getAgentDetails(agentId),
    enabled: !!agentId,
  });
}

// Export API for direct use if needed
export { api as CalendarSyncAPI };