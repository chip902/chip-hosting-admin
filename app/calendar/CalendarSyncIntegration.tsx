'use client';

import React, { useState, useEffect } from 'react';
import { CalendarClient, CalendarProvider, CalendarEvent, SyncDestination } from '../../lib/CalendarClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, RefreshCw, Calendar } from 'lucide-react';

// Initial setup with environment variables
const API_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || "/api/calendar";
const calendarClient = new CalendarClient(API_URL);

export default function CalendarSyncIntegration({ 
  onEventsLoaded 
}: { 
  onEventsLoaded: (events: any[]) => void 
}) {
  // Authentication state
  const [googleAuth, setGoogleAuth] = useState<boolean>(false);
  const [microsoftAuth, setMicrosoftAuth] = useState<boolean>(false);
  const [appleAuth, setAppleAuth] = useState<boolean>(false);
  const [exchangeAuth, setExchangeAuth] = useState<boolean>(false);
  
  // State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncConfigured, setSyncConfigured] = useState<boolean>(false);
  
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
      if (config.destination) {
        setSyncConfigured(true);
        console.log("Sync configured with destination:", config.destination.name);
        
        // Get events from the destination calendar
        await fetchCalendarEvents();
      }
      
      // Check for authenticated providers
      if (config.sources) {
        config.sources.forEach(source => {
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
      const result = await calendarClient.getEvents();
      
      // Convert to FullCalendar format
      const fullCalendarEvents = result.events.map(event => ({
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
          calendarName: event.calendarName
        }
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
    switch(provider) {
      case CalendarProvider.GOOGLE:
        return '#4285F4'; // Google blue
      case CalendarProvider.MICROSOFT:
        return '#00A4EF'; // Microsoft blue
      case CalendarProvider.APPLE:
        return '#A2AAAD'; // Apple silver
      case CalendarProvider.EXCHANGE:
        return '#0078D4'; // Exchange blue
      default:
        return '#6941C6'; // Default purple
    }
  };
  
  // Authentication handlers
  const authenticateGoogle = async () => {
    try {
      const authUrl = await calendarClient.getAuthUrl(CalendarProvider.GOOGLE);
      window.location.href = authUrl;
    } catch (err: any) {
      setSyncError("Google authentication failed: " + err.message);
    }
  };
  
  const authenticateMicrosoft = async () => {
    try {
      const authUrl = await calendarClient.getAuthUrl(CalendarProvider.MICROSOFT);
      window.location.href = authUrl;
    } catch (err: any) {
      setSyncError("Microsoft authentication failed: " + err.message);
    }
  };
  
  const authenticateApple = async () => {
    try {
      const authUrl = await calendarClient.getAuthUrl(CalendarProvider.APPLE);
      window.location.href = authUrl;
    } catch (err: any) {
      setSyncError("Apple authentication failed: " + err.message);
    }
  };
  
  const authenticateExchange = async () => {
    try {
      const authUrl = await calendarClient.getAuthUrl(CalendarProvider.EXCHANGE);
      window.location.href = authUrl;
    } catch (err: any) {
      setSyncError("Exchange authentication failed: " + err.message);
    }
  };
  
  // Run calendar sync
  const syncCalendars = async () => {
    try {
      setSyncStatus('syncing');
      setSyncError(null);
      
      const result = await calendarClient.runSync();
      
      if (result.status === 'completed') {
        setSyncStatus('success');
        setLastSync(new Date().toLocaleString());
        
        // Refresh events
        await fetchCalendarEvents();
      } else {
        setSyncStatus('error');
        setSyncError(`Sync failed: ${result.errors?.join(', ')}`);
      }
    } catch (err: any) {
      setSyncStatus('error');
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
      const providerToUse = provider || (
        googleAuth ? CalendarProvider.GOOGLE : 
        microsoftAuth ? CalendarProvider.MICROSOFT :
        appleAuth ? CalendarProvider.APPLE :
        CalendarProvider.EXCHANGE
      );
      
      // Get calendars for this provider
      const calendarsResult = await calendarClient.listCalendars();
      const providerCalendars = calendarsResult[providerToUse] || [];
      
      if (providerCalendars.length === 0) {
        setSyncError(`No calendars found for ${providerToUse}`);
        return;
      }
      
      // Use the first calendar (usually primary) as destination
      const primaryCalendar = providerCalendars.find(cal => cal.primary || cal.isDefaultCalendar) || providerCalendars[0];
      
      // Create destination configuration
      const destination: SyncDestination = {
        id: `destination_${Date.now()}`,
        name: primaryCalendar.summary || primaryCalendar.name || "Calendar Hub",
        providerType: providerToUse,
        connectionInfo: {},
        credentials: calendarClient['credentials'][providerToUse],
        calendarId: primaryCalendar.id,
        conflictResolution: "latest_wins",
        categories: {},
        sourceCalendars: {},
        colorManagement: "separate_calendar"
      };
      
      // Configure the destination
      await calendarClient.configureDestination(destination);
      
      // Add other providers as sources
      const providers = [
        googleAuth && providerToUse !== CalendarProvider.GOOGLE ? CalendarProvider.GOOGLE : null,
        microsoftAuth && providerToUse !== CalendarProvider.MICROSOFT ? CalendarProvider.MICROSOFT : null,
        appleAuth && providerToUse !== CalendarProvider.APPLE ? CalendarProvider.APPLE : null,
        exchangeAuth && providerToUse !== CalendarProvider.EXCHANGE ? CalendarProvider.EXCHANGE : null
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
            credentials: calendarClient['credentials'][provider],
            syncDirection: "read_only",
            syncFrequency: "hourly",
            syncMethod: "api",
            calendars: providerCalendars.map(cal => cal.id),
            syncTokens: {},
            enabled: true
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
          <Button 
            onClick={syncCalendars} 
            variant="outline" 
            size="sm"
            disabled={syncStatus === 'syncing'}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </Button>
        ) : (
          <Button 
            onClick={() => configureDestination(googleAuth ? CalendarProvider.GOOGLE : CalendarProvider.MICROSOFT)} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Calendar Settings</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="accounts">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="sync">Sync</TabsTrigger>
              </TabsList>
              
              <TabsContent value="accounts" className="mt-4">
                <div className="space-y-3">
                  <Button 
                    onClick={authenticateGoogle} 
                    variant={googleAuth ? "outline" : "default"} 
                    className="w-full justify-start gap-2"
                  >
                    {googleAuth ? '✓ Google Connected' : 'Connect Google Calendar'}
                  </Button>
                  
                  <Button 
                    onClick={authenticateMicrosoft} 
                    variant={microsoftAuth ? "outline" : "default"} 
                    className="w-full justify-start gap-2"
                  >
                    {microsoftAuth ? '✓ Microsoft Connected' : 'Connect Microsoft Calendar'}
                  </Button>
                  
                  <Button 
                    onClick={authenticateApple} 
                    variant={appleAuth ? "outline" : "default"} 
                    className="w-full justify-start gap-2"
                  >
                    {appleAuth ? '✓ Apple Connected' : 'Connect Apple Calendar'}
                  </Button>
                  
                  <Button 
                    onClick={authenticateExchange} 
                    variant={exchangeAuth ? "outline" : "default"} 
                    className="w-full justify-start gap-2"
                  >
                    {exchangeAuth ? '✓ Exchange Connected' : 'Connect Exchange Calendar'}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="sync" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Sync Status</h4>
                    <div className="text-sm">
                      {syncConfigured ? (
                        <p className="text-green-600 dark:text-green-400">
                          Calendar sync is configured
                        </p>
                      ) : (
                        <p className="text-amber-600 dark:text-amber-400">
                          Calendar sync is not configured
                        </p>
                      )}
                      
                      {lastSync && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          Last sync: {lastSync}
                        </p>
                      )}
                      
                      {syncError && (
                        <p className="text-red-600 dark:text-red-400 mt-1">
                          {syncError}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {syncConfigured ? (
                      <Button 
                        onClick={syncCalendars} 
                        className="w-full"
                        disabled={syncStatus === 'syncing'}
                      >
                        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={() => configureDestination(CalendarProvider.GOOGLE)} 
                          className="w-full mb-2"
                          disabled={!googleAuth}
                        >
                          Use Google as Master
                        </Button>
                        
                        <Button 
                          onClick={() => configureDestination(CalendarProvider.MICROSOFT)} 
                          className="w-full"
                          disabled={!microsoftAuth}
                        >
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
      {syncStatus === 'error' && syncError && (
        <div className="text-sm text-red-600 dark:text-red-400 mt-2">
          {syncError}
        </div>
      )}
      
      {syncStatus === 'success' && (
        <div className="text-sm text-green-600 dark:text-green-400 mt-2">
          Sync completed successfully
        </div>
      )}
    </>
  );
}