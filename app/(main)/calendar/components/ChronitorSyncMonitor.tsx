"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Calendar, 
  Zap,
  Activity,
  TrendingUp,
  Eye,
  Play
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";

// Chroniton Capacitor API configuration
const CHRONITON_API_URL = process.env.NEXT_PUBLIC_CHRONITON_API_URL || "http://ark:8008";

interface SyncStats {
  total_events: number;
  total_agents: number;
  active_agents: number;
  events_by_agent: Record<string, number>;
  events_by_provider: Record<string, number>;
  last_updated: string;
}

interface SyncSource {
  id: string;
  name: string;
  provider_type: string;
  calendars: string[];
  enabled: boolean;
  last_sync?: string;
  sync_tokens: Record<string, string>;
}

interface SyncOperation {
  status: "started" | "completed" | "failed";
  operation_id?: string;
  message: string;
  start_time?: string;
  end_time?: string;
  events_synced?: number;
  events_failed?: number;
  source_id?: string;
}

interface SyncDestination {
  id: string;
  name: string;
  provider_type: string;
  calendar_id: string;
  conflict_resolution: string;
  color_management: string;
}

export default function ChronitorSyncMonitor() {
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncSources, setSyncSources] = useState<SyncSource[]>([]);
  const [syncDestination, setSyncDestination] = useState<SyncDestination | null>(null);
  const [activeSyncOperations, setActiveSyncOperations] = useState<SyncOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadAllData();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Initial load
  useEffect(() => {
    loadAllData();
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

  // Load all monitoring data
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load stats, sources, and config in parallel
      const [stats, sources, config] = await Promise.all([
        apiCall("/sync/stats").catch(() => ({ total_events: 0, total_agents: 0, active_agents: 0, events_by_agent: {}, events_by_provider: {}, last_updated: new Date().toISOString() })),
        apiCall("/sync/sources").catch(() => []),
        apiCall("/sync/config").catch(() => ({}))
      ]);
      
      setSyncStats(stats);
      setSyncSources(sources);
      setSyncDestination(config.destination || null);
      setLastRefresh(new Date());
      
    } catch (error: any) {
      console.error("Failed to load monitoring data:", error);
      toast({
        title: "Error",
        description: "Failed to load sync monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Run full sync
  const runFullSync = async () => {
    try {
      setLoading(true);
      const result = await apiCall("/sync/run", { method: "POST" });
      
      if (result.status === "started") {
        toast({
          title: "Sync Started",
          description: `Operation ID: ${result.operation_id}`,
        });
        
        // Add to active operations
        setActiveSyncOperations(prev => [result, ...prev.slice(0, 4)]); // Keep last 5
        
        // Force refresh after a delay
        setTimeout(loadAllData, 2000);
        
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

  // Run sync for specific source
  const runSourceSync = async (sourceId: string) => {
    try {
      setLoading(true);
      const result = await apiCall(`/sync/run/${sourceId}`, { method: "POST" });
      
      if (result.status === "started") {
        toast({
          title: "Source Sync Started",
          description: `${result.source_id}: ${result.operation_id}`,
        });
        
        setActiveSyncOperations(prev => [result, ...prev.slice(0, 4)]);
        setTimeout(loadAllData, 2000);
        
      } else {
        toast({
          title: "Source Sync Failed",
          description: result.message,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to run source sync: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return "Unknown";
    }
  };

  // Calculate sync health score
  const getSyncHealthScore = () => {
    if (!syncStats || !syncDestination) return 0;
    
    let score = 0;
    
    // Destination configured
    if (syncDestination) score += 30;
    
    // Active sources
    if (syncSources.length > 0) score += 20;
    
    // Recent activity
    if (syncStats.total_events > 0) score += 25;
    
    // No recent errors (mock check)
    score += 25;
    
    return Math.min(score, 100);
  };

  const healthScore = getSyncHealthScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sync Monitor</h2>
          <p className="text-muted-foreground">Real-time sync status and performance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "text-green-600" : ""}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh: {autoRefresh ? "On" : "Off"}
          </Button>
          <Button onClick={loadAllData} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={runFullSync} disabled={loading || !syncDestination} size="sm">
            <Play className="w-4 h-4 mr-2" />
            Run Sync
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{healthScore}%</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-muted flex items-center justify-center relative">
                <div 
                  className={`absolute inset-0 rounded-full border-4 border-r-transparent transition-all duration-500 ${
                    healthScore > 80 ? 'border-green-500' : 
                    healthScore > 60 ? 'border-yellow-500' : 'border-red-500'
                  }`}
                  style={{ 
                    transform: `rotate(${(healthScore / 100) * 360 - 90}deg)`,
                  }}
                />
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Total Events</p>
                <p className="text-2xl font-bold">{syncStats?.total_events?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Sources</p>
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
                  {syncDestination ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="destructive">None</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {lastRefresh ? formatTime(lastRefresh.toISOString()) : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync Sources Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Sync Sources ({syncSources.length})
            </CardTitle>
            <CardDescription>
              Status and performance of individual sync sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syncSources.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No sync sources configured. Add some Google accounts to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {syncSources.map((source) => (
                  <div key={source.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{source.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {source.provider_type} • {source.calendars.length} calendars
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={source.enabled ? "default" : "secondary"}>
                          {source.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Button
                          onClick={() => runSourceSync(source.id)}
                          disabled={loading || !source.enabled}
                          size="sm"
                          variant="outline"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {source.last_sync && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {formatTime(source.last_sync)}
                      </p>
                    )}
                    
                    {Object.keys(source.sync_tokens).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Sync tokens: {Object.keys(source.sync_tokens).length} calendars
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity & Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Live sync operations and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 overflow-y-auto">
              {activeSyncOperations.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent sync operations</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSyncOperations.map((operation, index) => (
                    <div key={operation.operation_id || index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {operation.status === "started" && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
                        {operation.status === "completed" && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {operation.status === "failed" && <AlertCircle className="w-4 h-4 text-red-600" />}
                        
                        <Badge variant={
                          operation.status === "completed" ? "default" :
                          operation.status === "failed" ? "destructive" : "secondary"
                        }>
                          {operation.status}
                        </Badge>
                        
                        {operation.source_id && (
                          <Badge variant="outline" className="text-xs">
                            {operation.source_id}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm mb-1">{operation.message}</p>
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {operation.start_time && formatTime(operation.start_time)}
                          {operation.end_time && ` - ${formatTime(operation.end_time)}`}
                        </span>
                        {operation.operation_id && (
                          <span className="font-mono">
                            {operation.operation_id.split('_')[1]?.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      {(operation.events_synced !== undefined || operation.events_failed !== undefined) && (
                        <div className="mt-2 flex gap-4 text-xs">
                          {operation.events_synced !== undefined && (
                            <span className="text-green-600">
                              ✓ {operation.events_synced} synced
                            </span>
                          )}
                          {operation.events_failed !== undefined && operation.events_failed > 0 && (
                            <span className="text-red-600">
                              ✗ {operation.events_failed} failed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Statistics */}
      {syncStats && Object.keys(syncStats.events_by_provider).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events by Provider</CardTitle>
            <CardDescription>
              Distribution of events across different calendar providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(syncStats.events_by_provider).map(([provider, count]) => (
                <div key={provider} className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground capitalize">{provider}</p>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ 
                        width: `${Math.min((count / (syncStats.total_events || 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destination Status */}
      {syncDestination && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Destination Configuration
            </CardTitle>
            <CardDescription>
              Where your synchronized events are stored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Destination Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{syncDestination.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider:</span>
                    <Badge variant="outline">{syncDestination.provider_type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calendar ID:</span>
                    <span className="font-mono text-xs">{syncDestination.calendar_id}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Sync Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conflict Resolution:</span>
                    <Badge variant="outline">{syncDestination.conflict_resolution}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color Management:</span>
                    <Badge variant="outline">{syncDestination.color_management}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}