"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  RefreshCw, 
  Settings, 
  Zap, 
  Apple, 
  Mail, 
  Loader2,
  ArrowRight,
  Check,
  AlertTriangle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useEnhancedCalendar } from "@/app/hooks/useEnhancedCalendar";
import EnhancedCalendarIntegration from "./EnhancedCalendarIntegration";
import { CalendarProvider } from "@/types/calendar";

interface CalendarIntegrationBridgeProps {
  onEventsUpdate?: (events: any[]) => void;
  showFullInterface?: boolean;
}

export default function CalendarIntegrationBridge({ 
  onEventsUpdate, 
  showFullInterface = false 
}: CalendarIntegrationBridgeProps) {
  const [enhancedState, enhancedActions] = useEnhancedCalendar();
  
  // Bridge settings
  const [enableAppleSync, setEnableAppleSync] = useState<boolean>(false);
  const [enableExchangeSync, setEnableExchangeSync] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = disabled
  
  // Sync status
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);

  // Auto-refresh timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefreshInterval > 0 && (enableAppleSync || enableExchangeSync)) {
      interval = setInterval(() => {
        performIntegratedSync();
      }, autoRefreshInterval * 60 * 1000); // Convert minutes to milliseconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefreshInterval, enableAppleSync, enableExchangeSync]);

  // Perform integrated sync across all enabled services
  const performIntegratedSync = async () => {
    if (syncInProgress) return;
    
    setSyncInProgress(true);
    let allEvents: any[] = [];
    
    try {
      // Sync Apple Calendar if enabled and available
      if (enableAppleSync && enhancedState.appleAvailable && enhancedState.appleCalendars.length > 0) {
        // Sync events from all Apple calendars
        for (const calendar of enhancedState.appleCalendars) {
          await enhancedActions.fetchAppleEvents(calendar.id);
        }
      }
      
      // Sync Exchange if enabled and available
      if (enableExchangeSync && enhancedState.exchangeAvailable && enhancedState.exchangeCalendars.length > 0) {
        // Sync events from all Exchange calendars
        for (const calendar of enhancedState.exchangeCalendars) {
          await enhancedActions.fetchExchangeEvents(calendar.id);
        }
      }
      
      // Get all events in standard format
      allEvents = enhancedActions.exportToStandardFormat();
      
      // Update parent component with new events
      if (onEventsUpdate) {
        onEventsUpdate(allEvents);
      }
      
      setLastSyncTime(new Date());
      toast.success(`Sync completed! Retrieved ${allEvents.length} events from enhanced sources.`);
      
    } catch (error) {
      console.error("Integrated sync failed:", error);
      toast.error("Sync failed. Check your calendar connections.");
    } finally {
      setSyncInProgress(false);
    }
  };

  // Quick setup for Apple Calendar
  const quickSetupApple = async () => {
    try {
      await enhancedActions.checkAppleAvailability();
      if (enhancedState.appleAvailable) {
        await enhancedActions.fetchAppleCalendars();
        setEnableAppleSync(true);
        toast.success("Apple Calendar integration ready!");
      } else {
        toast.error("Apple Calendar is not available on this system");
      }
    } catch (error) {
      toast.error("Failed to setup Apple Calendar integration");
    }
  };

  // Quick setup for Exchange
  const quickSetupExchange = async () => {
    if (!enhancedState.exchangeConfig.server_url) {
      toast.error("Please configure Exchange server settings first");
      return;
    }
    
    try {
      const success = await enhancedActions.testExchangeConnection();
      if (success) {
        await enhancedActions.fetchExchangeCalendars();
        setEnableExchangeSync(true);
        toast.success("Exchange integration ready!");
      } else {
        toast.error("Failed to connect to Exchange server");
      }
    } catch (error) {
      toast.error("Failed to setup Exchange integration");
    }
  };

  // Get sync status info
  const getSyncStatus = () => {
    if (syncInProgress) {
      return { text: "Syncing...", color: "yellow", icon: Loader2 };
    }
    
    if (!enableAppleSync && !enableExchangeSync) {
      return { text: "Not configured", color: "gray", icon: Settings };
    }
    
    if (lastSyncTime) {
      const timeSinceSync = Date.now() - lastSyncTime.getTime();
      const minutes = Math.floor(timeSinceSync / (1000 * 60));
      return { 
        text: `Last sync: ${minutes < 1 ? 'just now' : `${minutes}m ago`}`, 
        color: "green", 
        icon: Check 
      };
    }
    
    return { text: "Ready to sync", color: "blue", icon: Zap };
  };

  const syncStatus = getSyncStatus();
  const StatusIcon = syncStatus.icon;

  if (showFullInterface) {
    return <EnhancedCalendarIntegration />;
  }

  return (
    <div className="space-y-4">
      {/* Quick Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <Zap className="h-5 w-5 text-muted-foreground mr-2" />
          <CardTitle className="text-base">Enhanced Calendar Bridge</CardTitle>
          <Badge 
            variant={syncStatus.color === "green" ? "default" : "secondary"} 
            className="ml-auto"
          >
            <StatusIcon className={`h-3 w-3 mr-1 ${syncInProgress ? 'animate-spin' : ''}`} />
            {syncStatus.text}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <Apple className="h-4 w-4 mr-1" />
              <span className={enableAppleSync && enhancedState.appleAvailable ? "text-green-600" : "text-muted-foreground"}>
                Apple ({enhancedState.appleCalendars.length} calendars)
              </span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              <span className={enableExchangeSync && enhancedState.exchangeAvailable ? "text-green-600" : "text-muted-foreground"}>
                Exchange ({enhancedState.exchangeCalendars.length} calendars)
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={performIntegratedSync}
              disabled={syncInProgress || (!enableAppleSync && !enableExchangeSync)}
              size="sm"
              variant="outline"
            >
              {syncInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Enhanced Calendar Integration Settings</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="services" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="sync">Sync Settings</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="services" className="space-y-6">
                    {/* Apple Calendar Service */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Apple className="h-5 w-5 mr-2" />
                            <CardTitle className="text-lg">Apple Calendar</CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={enhancedState.appleAvailable ? "default" : "secondary"}>
                              {enhancedState.appleAvailable ? "Available" : "Unavailable"}
                            </Badge>
                            <Switch 
                              checked={enableAppleSync}
                              onCheckedChange={setEnableAppleSync}
                              disabled={!enhancedState.appleAvailable}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {enhancedState.appleAvailable ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Access method: {enhancedState.appleAccessMethod}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Calendars: {enhancedState.appleCalendars.length}
                            </p>
                            {enhancedState.appleCalendars.length === 0 && (
                              <Button 
                                onClick={quickSetupApple}
                                size="sm"
                                variant="outline"
                                disabled={enhancedState.loadingApple}
                              >
                                {enhancedState.loadingApple ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Apple className="h-4 w-4 mr-2" />
                                )}
                                Setup Apple Calendar
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              Apple Calendar is not available. Make sure you're on macOS with Calendar.app installed.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Exchange Service */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 mr-2" />
                            <CardTitle className="text-lg">Exchange Web Services</CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={enhancedState.exchangeAvailable ? "default" : "secondary"}>
                              {enhancedState.exchangeAvailable ? "Connected" : "Not Connected"}
                            </Badge>
                            <Switch 
                              checked={enableExchangeSync}
                              onCheckedChange={setEnableExchangeSync}
                              disabled={!enhancedState.exchangeAvailable}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Server: {enhancedState.exchangeConfig.server_url || "Not configured"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Calendars: {enhancedState.exchangeCalendars.length}
                          </p>
                          {!enhancedState.exchangeAvailable && (
                            <Button 
                              onClick={quickSetupExchange}
                              size="sm"
                              variant="outline"
                              disabled={enhancedState.loadingExchange}
                            >
                              {enhancedState.loadingExchange ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Mail className="h-4 w-4 mr-2" />
                              )}
                              Setup Exchange
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="sync" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Auto-Refresh Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="auto-refresh">Auto-refresh interval</Label>
                            <p className="text-sm text-muted-foreground">
                              Automatically sync calendars at regular intervals
                            </p>
                          </div>
                          <select 
                            id="auto-refresh"
                            value={autoRefreshInterval}
                            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                          >
                            <option value={0}>Disabled</option>
                            <option value={5}>Every 5 minutes</option>
                            <option value={15}>Every 15 minutes</option>
                            <option value={30}>Every 30 minutes</option>
                            <option value={60}>Every hour</option>
                          </select>
                        </div>
                        
                        {lastSyncTime && (
                          <div className="text-sm text-muted-foreground">
                            Last sync: {lastSyncTime.toLocaleString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Advanced Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Show full configuration interface</Label>
                          <Button 
                            onClick={() => window.open('/calendar/enhanced', '_blank')}
                            size="sm"
                            variant="outline"
                          >
                            Open Advanced Interface
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                        
                        <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-100">Enhanced Calendar Bridge</p>
                            <p className="text-blue-700 dark:text-blue-300">
                              This bridge provides seamless integration between the enhanced calendar services 
                              (Apple Calendar via AppleScript and Exchange Web Services) and your existing 
                              calendar system.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}