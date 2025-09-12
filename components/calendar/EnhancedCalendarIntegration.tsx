"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar, 
  RefreshCw, 
  Settings, 
  Check, 
  X, 
  AlertCircle, 
  Apple, 
  Mail, 
  Clock,
  Users,
  MapPin,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

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

export default function EnhancedCalendarIntegration() {
  // State for services availability
  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const [exchangeAvailable, setExchangeAvailable] = useState<boolean>(false);
  const [appleAccessMethod, setAppleAccessMethod] = useState<string>("");

  // State for calendars
  const [appleCalendars, setAppleCalendars] = useState<AppleCalendar[]>([]);
  const [exchangeCalendars, setExchangeCalendars] = useState<ExchangeCalendar[]>([]);
  
  // State for events
  const [appleEvents, setAppleEvents] = useState<CalendarEvent[]>([]);
  const [exchangeEvents, setExchangeEvents] = useState<CalendarEvent[]>([]);
  
  // Loading states
  const [loadingApple, setLoadingApple] = useState<boolean>(false);
  const [loadingExchange, setLoadingExchange] = useState<boolean>(false);
  const [loadingAppleEvents, setLoadingAppleEvents] = useState<boolean>(false);
  const [loadingExchangeEvents, setLoadingExchangeEvents] = useState<boolean>(false);

  // Exchange configuration
  const [exchangeConfig, setExchangeConfig] = useState<ExchangeConfig>({
    server_url: "",
    username: "",
    password: "",
    email: "",
    auth_type: "basic",
    verify_ssl: true,
  });
  
  // Selected calendars
  const [selectedAppleCalendar, setSelectedAppleCalendar] = useState<string>("");
  const [selectedExchangeCalendar, setSelectedExchangeCalendar] = useState<string>("");

  // Calendar sync to Chroniton Capacitor API
  const CHRONITON_API_URL = process.env.NEXT_PUBLIC_CHRONITON_API_URL || "http://localhost:8008/api";

  useEffect(() => {
    checkAppleCalendarAvailability();
  }, []);

  // Check if Apple Calendar service is available
  const checkAppleCalendarAvailability = async () => {
    try {
      const response = await fetch(`${CHRONITON_API_URL}/apple/calendars`);
      if (response.ok) {
        const data = await response.json();
        setAppleAvailable(data.available);
        setAppleAccessMethod(data.access_method);
        if (data.available && data.calendars) {
          setAppleCalendars(data.calendars);
        }
      }
    } catch (error) {
      console.error("Error checking Apple Calendar availability:", error);
      setAppleAvailable(false);
    }
  };

  // Fetch Apple Calendar calendars
  const fetchAppleCalendars = async () => {
    setLoadingApple(true);
    try {
      const response = await fetch(`${CHRONITON_API_URL}/apple/calendars`);
      if (response.ok) {
        const data = await response.json();
        setAppleCalendars(data.calendars || []);
        setAppleAvailable(data.available);
        setAppleAccessMethod(data.access_method);
        toast.success(`Found ${data.calendars?.length || 0} Apple calendars using ${data.access_method}`);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to fetch Apple calendars: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error fetching Apple calendars:", error);
      toast.error("Failed to connect to Apple Calendar service");
    } finally {
      setLoadingApple(false);
    }
  };

  // Fetch Exchange calendars
  const fetchExchangeCalendars = async () => {
    if (!exchangeConfig.server_url || !exchangeConfig.username || !exchangeConfig.password || !exchangeConfig.email) {
      toast.error("Please fill in all Exchange server configuration fields");
      return;
    }

    setLoadingExchange(true);
    try {
      const response = await fetch(`${CHRONITON_API_URL}/exchange/calendars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exchangeConfig),
      });

      if (response.ok) {
        const data = await response.json();
        setExchangeCalendars(data.calendars || []);
        setExchangeAvailable(data.available);
        toast.success(`Found ${data.calendars?.length || 0} Exchange calendars`);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to fetch Exchange calendars: ${errorData.detail}`);
        setExchangeAvailable(false);
      }
    } catch (error) {
      console.error("Error fetching Exchange calendars:", error);
      toast.error("Failed to connect to Exchange server");
      setExchangeAvailable(false);
    } finally {
      setLoadingExchange(false);
    }
  };

  // Fetch Apple Calendar events
  const fetchAppleEvents = async (calendarId: string) => {
    if (!calendarId) return;

    setLoadingAppleEvents(true);
    try {
      const params = new URLSearchParams({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ahead
        max_results: "50",
      });

      const response = await fetch(`${CHRONITON_API_URL}/apple/events/${calendarId}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAppleEvents(data.events || []);
        toast.success(`Loaded ${data.events?.length || 0} Apple Calendar events`);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to fetch Apple events: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error fetching Apple events:", error);
      toast.error("Failed to load Apple Calendar events");
    } finally {
      setLoadingAppleEvents(false);
    }
  };

  // Fetch Exchange events
  const fetchExchangeEvents = async (calendarId: string) => {
    if (!calendarId || !exchangeConfig.server_url) return;

    setLoadingExchangeEvents(true);
    try {
      const params = new URLSearchParams({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ahead
        max_results: "50",
      });

      const response = await fetch(`${CHRONITON_API_URL}/exchange/events/${calendarId}?${params}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exchangeConfig),
      });

      if (response.ok) {
        const data = await response.json();
        setExchangeEvents(data.events || []);
        toast.success(`Loaded ${data.events?.length || 0} Exchange events`);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to fetch Exchange events: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error fetching Exchange events:", error);
      toast.error("Failed to load Exchange events");
    } finally {
      setLoadingExchangeEvents(false);
    }
  };

  // Handle calendar selection change
  const handleAppleCalendarChange = (calendarId: string) => {
    setSelectedAppleCalendar(calendarId);
    if (calendarId) {
      fetchAppleEvents(calendarId);
    }
  };

  const handleExchangeCalendarChange = (calendarId: string) => {
    setSelectedExchangeCalendar(calendarId);
    if (calendarId) {
      fetchExchangeEvents(calendarId);
    }
  };

  // Format event for display
  const formatEventTime = (startTime: string, endTime: string, allDay: boolean) => {
    if (allDay) return "All Day";
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return `${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;
  };

  const formatEventDate = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Calendar Integration</h2>
          <p className="text-muted-foreground">Access Apple Calendar and Exchange Web Services directly</p>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apple Calendar Card */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Apple className="h-5 w-5 text-muted-foreground mr-2" />
            <CardTitle className="text-base">Apple Calendar</CardTitle>
            <Badge variant={appleAvailable ? "default" : "secondary"} className="ml-auto">
              {appleAvailable ? "Available" : "Unavailable"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {appleAvailable ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Access method: <span className="font-medium">{appleAccessMethod}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Calendars found: <span className="font-medium">{appleCalendars.length}</span>
                </div>
                <Button 
                  onClick={fetchAppleCalendars} 
                  disabled={loadingApple} 
                  size="sm" 
                  className="w-full"
                >
                  {loadingApple ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Calendars
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Apple Calendar service is not available. Make sure you're on macOS with Calendar.app installed.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange Web Services Card */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Mail className="h-5 w-5 text-muted-foreground mr-2" />
            <CardTitle className="text-base">Exchange Web Services</CardTitle>
            <Badge variant={exchangeAvailable ? "default" : "secondary"} className="ml-auto">
              {exchangeAvailable ? "Connected" : "Not Connected"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Calendars found: <span className="font-medium">{exchangeCalendars.length}</span>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Server
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Exchange Server Configuration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="server_url">Server URL</Label>
                    <Input
                      id="server_url"
                      placeholder="https://your-exchange-server.com/EWS/Exchange.asmx"
                      value={exchangeConfig.server_url}
                      onChange={(e) => setExchangeConfig({...exchangeConfig, server_url: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="your-username"
                      value={exchangeConfig.username}
                      onChange={(e) => setExchangeConfig({...exchangeConfig, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="your-password"
                      value={exchangeConfig.password}
                      onChange={(e) => setExchangeConfig({...exchangeConfig, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your-email@domain.com"
                      value={exchangeConfig.email}
                      onChange={(e) => setExchangeConfig({...exchangeConfig, email: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="verify_ssl"
                      checked={exchangeConfig.verify_ssl}
                      onCheckedChange={(checked) => setExchangeConfig({...exchangeConfig, verify_ssl: checked})}
                    />
                    <Label htmlFor="verify_ssl">Verify SSL Certificate</Label>
                  </div>
                  <Button 
                    onClick={fetchExchangeCalendars} 
                    disabled={loadingExchange} 
                    className="w-full"
                  >
                    {loadingExchange ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Test & Connect
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Selection & Events */}
      <Tabs defaultValue="apple" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apple" disabled={!appleAvailable}>
            <Apple className="h-4 w-4 mr-2" />
            Apple Calendar
          </TabsTrigger>
          <TabsTrigger value="exchange" disabled={!exchangeAvailable}>
            <Mail className="h-4 w-4 mr-2" />
            Exchange
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apple" className="space-y-4">
          {appleAvailable && appleCalendars.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Apple Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedAppleCalendar} onValueChange={handleAppleCalendarChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a calendar to view events" />
                    </SelectTrigger>
                    <SelectContent>
                      {appleCalendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          <div className="flex items-center">
                            {calendar.name}
                            {calendar.primary && (
                              <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedAppleCalendar && (
                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0">
                    <CardTitle className="text-lg">Apple Calendar Events</CardTitle>
                    {loadingAppleEvents && (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {appleEvents.length > 0 ? (
                        appleEvents.map((event) => (
                          <div key={event.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {formatEventDate(event.startTime)}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatEventTime(event.startTime, event.endTime, event.allDay)}
                            </div>
                            {event.location && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </div>
                            )}
                            {event.participants.length > 0 && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="h-3 w-3 mr-1" />
                                {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No events found in the selected date range
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="exchange" className="space-y-4">
          {exchangeAvailable && exchangeCalendars.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Exchange Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedExchangeCalendar} onValueChange={handleExchangeCalendarChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a calendar to view events" />
                    </SelectTrigger>
                    <SelectContent>
                      {exchangeCalendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          <div className="flex items-center">
                            {calendar.name || calendar.summary}
                            {calendar.primary && (
                              <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedExchangeCalendar && (
                <Card>
                  <CardHeader className="flex flex-row items-center space-y-0">
                    <CardTitle className="text-lg">Exchange Calendar Events</CardTitle>
                    {loadingExchangeEvents && (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {exchangeEvents.length > 0 ? (
                        exchangeEvents.map((event) => (
                          <div key={event.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {formatEventDate(event.startTime)}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatEventTime(event.startTime, event.endTime, event.allDay)}
                            </div>
                            {event.location && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </div>
                            )}
                            {event.organizer && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="h-3 w-3 mr-1" />
                                {event.organizer.name || event.organizer.email}
                              </div>
                            )}
                            {event.participants.length > 0 && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="h-3 w-3 mr-1" />
                                {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No events found in the selected date range
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}