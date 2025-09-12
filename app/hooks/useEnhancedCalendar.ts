import { useState, useEffect, useCallback } from "react";
import { CalendarProvider } from "@/types/calendar";

interface EnhancedCalendarConfig {
  chronitonApiUrl: string;
}

interface AppleCalendar {
  id: string;
  name: string;
  primary: boolean;
  writable: boolean;
  provider: string;
}

interface ExchangeCalendar {
  id: string;
  name: string;
  summary: string;
  primary: boolean;
  writable: boolean;
  provider: string;
  email: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  organizer?: {
    email?: string;
    name?: string;
  };
  participants: Array<{
    email?: string;
    name?: string;
    status?: string;
  }>;
  provider: string;
  calendarId: string;
  calendarName?: string;
}

interface ExchangeConfig {
  server_url: string;
  username: string;
  password: string;
  email: string;
  auth_type?: string;
  verify_ssl?: boolean;
}

interface EnhancedCalendarState {
  // Apple Calendar
  appleAvailable: boolean;
  appleAccessMethod: string;
  appleCalendars: AppleCalendar[];
  appleEvents: CalendarEvent[];
  
  // Exchange Web Services
  exchangeAvailable: boolean;
  exchangeCalendars: ExchangeCalendar[];
  exchangeEvents: CalendarEvent[];
  exchangeConfig: ExchangeConfig;
  
  // Loading states
  loadingApple: boolean;
  loadingExchange: boolean;
  loadingAppleEvents: boolean;
  loadingExchangeEvents: boolean;
  
  // Error states
  appleError: string | null;
  exchangeError: string | null;
}

interface EnhancedCalendarActions {
  // Apple Calendar actions
  checkAppleAvailability: () => Promise<void>;
  fetchAppleCalendars: () => Promise<void>;
  fetchAppleEvents: (calendarId: string, options?: EventFetchOptions) => Promise<void>;
  
  // Exchange actions
  setExchangeConfig: (config: ExchangeConfig) => void;
  testExchangeConnection: () => Promise<boolean>;
  fetchExchangeCalendars: () => Promise<void>;
  fetchExchangeEvents: (calendarId: string, options?: EventFetchOptions) => Promise<void>;
  
  // Utility actions
  clearErrors: () => void;
  getAllEvents: () => CalendarEvent[];
  exportToStandardFormat: () => Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    color: string;
    extendedProps: Record<string, any>;
  }>;
}

interface EventFetchOptions {
  startDate?: Date;
  endDate?: Date;
  maxResults?: number;
}

export function useEnhancedCalendar(config?: EnhancedCalendarConfig): [EnhancedCalendarState, EnhancedCalendarActions] {
  const chronitonApiUrl = config?.chronitonApiUrl || process.env.NEXT_PUBLIC_CHRONITON_API_URL || "http://localhost:8008/api";

  // State
  const [state, setState] = useState<EnhancedCalendarState>({
    // Apple Calendar
    appleAvailable: false,
    appleAccessMethod: "",
    appleCalendars: [],
    appleEvents: [],
    
    // Exchange Web Services
    exchangeAvailable: false,
    exchangeCalendars: [],
    exchangeEvents: [],
    exchangeConfig: {
      server_url: "",
      username: "",
      password: "",
      email: "",
      auth_type: "basic",
      verify_ssl: true,
    },
    
    // Loading states
    loadingApple: false,
    loadingExchange: false,
    loadingAppleEvents: false,
    loadingExchangeEvents: false,
    
    // Error states
    appleError: null,
    exchangeError: null,
  });

  // Helper function to get event color based on provider
  const getEventColor = (provider: string): string => {
    switch (provider) {
      case CalendarProvider.APPLE:
        return "#A2AAAD"; // Apple silver
      case CalendarProvider.EXCHANGE:
        return "#0078D4"; // Exchange blue
      case CalendarProvider.GOOGLE:
        return "#4285F4"; // Google blue
      case CalendarProvider.MICROSOFT:
        return "#00A4EF"; // Microsoft blue
      default:
        return "#6941C6"; // Default purple
    }
  };

  // Apple Calendar actions
  const checkAppleAvailability = useCallback(async () => {
    setState(prev => ({ ...prev, loadingApple: true, appleError: null }));
    
    try {
      const response = await fetch(`${chronitonApiUrl}/apple/calendars`);
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          appleAvailable: data.available,
          appleAccessMethod: data.access_method,
          appleCalendars: data.calendars || [],
          loadingApple: false,
        }));
      } else {
        const errorData = await response.json();
        setState(prev => ({
          ...prev,
          appleAvailable: false,
          appleError: errorData.detail || "Failed to check Apple Calendar availability",
          loadingApple: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        appleAvailable: false,
        appleError: "Failed to connect to Apple Calendar service",
        loadingApple: false,
      }));
    }
  }, [chronitonApiUrl]);

  const fetchAppleCalendars = useCallback(async () => {
    setState(prev => ({ ...prev, loadingApple: true, appleError: null }));
    
    try {
      const response = await fetch(`${chronitonApiUrl}/apple/calendars`);
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          appleAvailable: data.available,
          appleAccessMethod: data.access_method,
          appleCalendars: data.calendars || [],
          loadingApple: false,
        }));
      } else {
        const errorData = await response.json();
        setState(prev => ({
          ...prev,
          appleError: errorData.detail || "Failed to fetch Apple calendars",
          loadingApple: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        appleError: "Failed to fetch Apple calendars",
        loadingApple: false,
      }));
    }
  }, [chronitonApiUrl]);

  const fetchAppleEvents = useCallback(async (calendarId: string, options: EventFetchOptions = {}) => {
    if (!calendarId) return;

    setState(prev => ({ ...prev, loadingAppleEvents: true, appleError: null }));

    try {
      const {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
        maxResults = 100,
      } = options;

      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        max_results: maxResults.toString(),
      });

      const response = await fetch(`${chronitonApiUrl}/apple/events/${calendarId}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          appleEvents: data.events || [],
          loadingAppleEvents: false,
        }));
      } else {
        const errorData = await response.json();
        setState(prev => ({
          ...prev,
          appleError: errorData.detail || "Failed to fetch Apple events",
          loadingAppleEvents: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        appleError: "Failed to fetch Apple events",
        loadingAppleEvents: false,
      }));
    }
  }, [chronitonApiUrl]);

  // Exchange actions
  const setExchangeConfig = useCallback((config: ExchangeConfig) => {
    setState(prev => ({ ...prev, exchangeConfig: config }));
  }, []);

  const testExchangeConnection = useCallback(async (): Promise<boolean> => {
    const { exchangeConfig } = state;
    
    if (!exchangeConfig.server_url || !exchangeConfig.username || !exchangeConfig.password || !exchangeConfig.email) {
      setState(prev => ({ ...prev, exchangeError: "Please fill in all Exchange configuration fields" }));
      return false;
    }

    setState(prev => ({ ...prev, loadingExchange: true, exchangeError: null }));

    try {
      const response = await fetch(`${chronitonApiUrl}/exchange/calendars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exchangeConfig),
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          exchangeAvailable: true,
          loadingExchange: false,
        }));
        return true;
      } else {
        const errorData = await response.json();
        setState(prev => ({
          ...prev,
          exchangeAvailable: false,
          exchangeError: errorData.detail || "Failed to connect to Exchange server",
          loadingExchange: false,
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        exchangeAvailable: false,
        exchangeError: "Failed to connect to Exchange server",
        loadingExchange: false,
      }));
      return false;
    }
  }, [chronitonApiUrl, state.exchangeConfig]);

  const fetchExchangeCalendars = useCallback(async () => {
    const { exchangeConfig } = state;

    if (!exchangeConfig.server_url || !exchangeConfig.username || !exchangeConfig.password || !exchangeConfig.email) {
      setState(prev => ({ ...prev, exchangeError: "Please configure Exchange server settings first" }));
      return;
    }

    setState(prev => ({ ...prev, loadingExchange: true, exchangeError: null }));

    try {
      const response = await fetch(`${chronitonApiUrl}/exchange/calendars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exchangeConfig),
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          exchangeAvailable: data.available,
          exchangeCalendars: data.calendars || [],
          loadingExchange: false,
        }));
      } else {
        const errorData = await response.json();
        setState(prev => ({
          ...prev,
          exchangeError: errorData.detail || "Failed to fetch Exchange calendars",
          loadingExchange: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        exchangeError: "Failed to fetch Exchange calendars",
        loadingExchange: false,
      }));
    }
  }, [chronitonApiUrl, state.exchangeConfig]);

  const fetchExchangeEvents = useCallback(async (calendarId: string, options: EventFetchOptions = {}) => {
    const { exchangeConfig } = state;
    
    if (!calendarId || !exchangeConfig.server_url) {
      setState(prev => ({ ...prev, exchangeError: "Calendar ID and Exchange configuration required" }));
      return;
    }

    setState(prev => ({ ...prev, loadingExchangeEvents: true, exchangeError: null }));

    try {
      const {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
        maxResults = 100,
      } = options;

      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        max_results: maxResults.toString(),
      });

      const response = await fetch(`${chronitonApiUrl}/exchange/events/${calendarId}?${params}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exchangeConfig),
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          exchangeEvents: data.events || [],
          loadingExchangeEvents: false,
        }));
      } else {
        const errorData = await response.json();
        setState(prev => ({
          ...prev,
          exchangeError: errorData.detail || "Failed to fetch Exchange events",
          loadingExchangeEvents: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        exchangeError: "Failed to fetch Exchange events",
        loadingExchangeEvents: false,
      }));
    }
  }, [chronitonApiUrl, state.exchangeConfig]);

  // Utility actions
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, appleError: null, exchangeError: null }));
  }, []);

  const getAllEvents = useCallback((): CalendarEvent[] => {
    return [...state.appleEvents, ...state.exchangeEvents];
  }, [state.appleEvents, state.exchangeEvents]);

  const exportToStandardFormat = useCallback(() => {
    const allEvents = getAllEvents();
    return allEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      allDay: event.allDay,
      color: getEventColor(event.provider),
      extendedProps: {
        description: event.description,
        location: event.location,
        provider: event.provider,
        calendarName: event.calendarName,
        organizer: event.organizer,
        participants: event.participants,
      },
    }));
  }, [getAllEvents]);

  // Initialize Apple Calendar availability check on mount
  useEffect(() => {
    checkAppleAvailability();
  }, [checkAppleAvailability]);

  // Actions object
  const actions: EnhancedCalendarActions = {
    // Apple Calendar actions
    checkAppleAvailability,
    fetchAppleCalendars,
    fetchAppleEvents,
    
    // Exchange actions
    setExchangeConfig,
    testExchangeConnection,
    fetchExchangeCalendars,
    fetchExchangeEvents,
    
    // Utility actions
    clearErrors,
    getAllEvents,
    exportToStandardFormat,
  };

  return [state, actions];
}