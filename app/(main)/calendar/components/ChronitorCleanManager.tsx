"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, Users, Zap, Mail, RefreshCw, ExternalLink, ChevronDown, ChevronRight, CheckCircle, Circle } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";

const CHRONITON_API_URL = process.env.NEXT_PUBLIC_CHRONITON_API_URL || "http://ark:8008";

interface SyncSource {
  id: string;
  name: string;
  provider_type: string;
  calendars: string[];
  enabled: boolean;
  last_sync?: string;
  credentials?: any;
  connection_info?: any;
}

interface CalendarDetails {
  id: string;
  name: string;
  primary?: boolean;
  description?: string;
  selected: boolean;
}

interface SyncDestination {
  id: string;
  name: string;
  provider_type: string;
}

export default function ChronitorCleanManager() {
  const [loading, setLoading] = useState(false);
  const [syncSources, setSyncSources] = useState<SyncSource[]>([]);
  const [syncDestination, setSyncDestination] = useState<SyncDestination | null>(null);
  const [calendarDetails, setCalendarDetails] = useState<Record<string, CalendarDetails[]>>({});
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // API helper
  const apiCall = async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`${CHRONITON_API_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
  };

  // Load existing configuration
  const loadConfig = async () => {
    try {
      const sources = await apiCall("/sync/sources");
      setSyncSources(sources || []);
      
      const config = await apiCall("/sync/config");
      if (config.destination) {
        setSyncDestination(config.destination);
      }

      // Load calendar details for each source
      await loadCalendarDetails(sources || []);
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  // Load calendar details for Google sources
  const loadCalendarDetails = async (sources: SyncSource[]) => {
    const details: Record<string, CalendarDetails[]> = {};

    for (const source of sources) {
      if (source.provider_type === 'google' && source.credentials) {
        try {
          // Fetch calendar list from Google API
          const calendarsResponse = await apiCall("/api/calendars?" + new URLSearchParams({
            credentials: JSON.stringify({ google: source.credentials })
          }));

          const googleCalendars = calendarsResponse.google || [];
          details[source.id] = googleCalendars.map((cal: any) => ({
            id: cal.id,
            name: cal.summary || cal.name || 'Unnamed Calendar',
            primary: cal.primary || false,
            description: cal.description,
            selected: source.calendars.includes(cal.id)
          }));
        } catch (error) {
          console.error(`Failed to load calendar details for ${source.id}:`, error);
          // Fallback to just showing calendar IDs
          details[source.id] = source.calendars.map(calId => ({
            id: calId,
            name: calId.includes('@group.calendar.google.com') ? 'Shared Calendar' : calId,
            selected: true
          }));
        }
      }
    }

    setCalendarDetails(details);
  };

  useEffect(() => {
    loadConfig();
    
    // Check for OAuth success redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth') === 'success') {
      const provider = urlParams.get('provider') || 'Google';
      toast({
        title: "Success!",
        description: `${provider} account connected and sync configured automatically!`,
      });
      
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      
      // Reload config to show new sync sources
      setTimeout(() => {
        loadConfig();
      }, 1000);
    }
  }, []);

  // Direct Google OAuth flow - opens OAuth and redirects back to frontend
  const connectGoogleAccount = async () => {
    try {
      setLoading(true);
      
      // Create redirect URL to come back to this page with success indicator
      const redirectUrl = `${window.location.origin}${window.location.pathname}?oauth=success&provider=google`;
      
      toast({
        title: "Opening Google Authorization",
        description: "Complete authorization, you'll be redirected back here when done!",
      });
      
      // Redirect directly to the OAuth endpoint
      const oauthUrl = `${CHRONITON_API_URL}/api/auth/google/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
      window.location.href = oauthUrl;
      
    } catch (error: any) {
      console.error("Auth URL generation error:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to start Google authorization";
      toast({
        title: "Error", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Direct Microsoft OAuth flow - opens OAuth and redirects back to frontend
  const connectMicrosoftAccount = async () => {
    try {
      setLoading(true);
      
      // Create redirect URL to come back to this page with success indicator
      const redirectUrl = `${window.location.origin}${window.location.pathname}?oauth=success&provider=Microsoft`;
      
      toast({
        title: "Opening Microsoft Authorization",
        description: "Complete authorization, you'll be redirected back here when done!",
      });
      
      // Redirect directly to the OAuth endpoint
      const oauthUrl = `${CHRONITON_API_URL}/api/auth/microsoft/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
      window.location.href = oauthUrl;
      
    } catch (error: any) {
      console.error("Microsoft Auth URL generation error:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to start Microsoft authorization";
      toast({
        title: "Error", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Run sync
  const runSync = async () => {
    try {
      setLoading(true);
      await apiCall("/sync/run", { method: "POST" });
      
      toast({
        title: "Sync Started",
        description: "Calendar synchronization is running in the background",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start sync",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle source expansion
  const toggleSourceExpansion = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  // Remove sync source
  const removeSyncSource = async (sourceId: string) => {
    try {
      await apiCall(`/sync/sources/${sourceId}`, { method: "DELETE" });
      await loadConfig();
      
      toast({
        title: "Success",
        description: "Sync source removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove sync source",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Calendar Sync</h2>
        <p className="text-muted-foreground mb-6">
          Connect your Google and Microsoft accounts to sync calendars automatically
        </p>
        
        <div className="flex justify-center gap-3">
          <Button onClick={connectGoogleAccount} disabled={loading} size="lg" className="gap-2">
            <ExternalLink className="w-5 h-5" />
            {loading ? "Connecting..." : "Connect Google Account"}
          </Button>
          <Button onClick={connectMicrosoftAccount} disabled={loading} size="lg" variant="outline" className="gap-2">
            <ExternalLink className="w-5 h-5" />
            {loading ? "Connecting..." : "Connect Microsoft Account"}
          </Button>
          {syncSources.length > 0 && (
            <Button 
              onClick={runSync} 
              disabled={loading} 
              variant="outline" 
              size="lg" 
              className="gap-2"
            >
              <Zap className="w-5 h-5" />
              Sync Now
            </Button>
          )}
          <Button 
            onClick={loadConfig} 
            variant="ghost" 
            size="lg" 
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">{syncSources.length}</div>
            <p className="text-sm text-muted-foreground">Connected Accounts</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">
              {syncSources.reduce((sum, source) => sum + source.calendars.length, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Synced Calendars</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {syncDestination ? "✓" : "✗"}
            </div>
            <p className="text-sm text-muted-foreground">Destination Ready</p>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      {syncSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Connected OAuth Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncSources.map((source) => {
              const calendars = calendarDetails[source.id] || [];
              const isExpanded = expandedSources.has(source.id);
              
              return (
                <div key={source.id} className="border rounded-lg">
                  {/* Source Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{source.name}</h4>
                          <Badge variant={source.enabled ? "default" : "secondary"}>
                            {source.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {source.calendars.length} calendars • Google • Last sync: {source.last_sync ? new Date(source.last_sync).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSourceExpansion(source.id)}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSyncSource(source.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Calendar Details (Expanded) */}
                  {isExpanded && (
                    <div className="border-t bg-muted/20">
                      <div className="p-4">
                        <h5 className="font-medium mb-3">Synced Calendars:</h5>
                        <div className="space-y-2">
                          {calendars.map((calendar) => (
                            <div key={calendar.id} className="flex items-center gap-3 p-2 rounded bg-background">
                              {calendar.selected ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{calendar.name}</span>
                                  {calendar.primary && (
                                    <Badge variant="outline" className="text-xs">Primary</Badge>
                                  )}
                                </div>
                                {calendar.description && (
                                  <p className="text-xs text-muted-foreground">{calendar.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground font-mono">{calendar.id}</p>
                              </div>
                            </div>
                          ))}
                          {calendars.length === 0 && (
                            <p className="text-sm text-muted-foreground">Loading calendar details...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {syncSources.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No accounts connected</h3>
            <p className="text-muted-foreground mb-4">
              Click "Connect Google Account" to start syncing your calendars automatically
            </p>
            <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 p-3 rounded max-w-md mx-auto">
              <strong>How it works:</strong>
              <br />
              1. Click the connect button above
              <br />
              2. Authorize Google in the new tab
              <br />
              3. Your calendars are automatically configured for sync
              <br />
              4. Events sync in the background
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}