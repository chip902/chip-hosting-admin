'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Server,
  Key,
  TestTube
} from 'lucide-react';
import { useToast } from '@/app/hooks/useToast';

interface CalDAVDestinationSetupProps {
  onDestinationConfigured?: (destination: any) => void;
  currentDestination?: any;
}

export default function CalDAVDestinationSetup({ 
  onDestinationConfigured, 
  currentDestination 
}: CalDAVDestinationSetupProps) {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [availableCalendars, setAvailableCalendars] = useState<any[]>([]);
  const [selectedCalendarUrl, setSelectedCalendarUrl] = useState('');
  const [calendarName, setCalendarName] = useState('Mailcow Calendar');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  
  const { toast } = useToast();
  
  const API_BASE = 'http://chepurny.com:8008';

  const testConnection = async () => {
    if (!serverUrl || !username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all connection details",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTestingConnection(true);
      
      const response = await fetch(`${API_BASE}/sync/config/caldav/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server_url: serverUrl,
          username: username,
          password: password
        })
      });

      console.log('Raw response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        data = { status: 'error', message: 'Invalid server response' };
      }
      
      console.log('CalDAV test response:', { status: response.status, data });

      if (response.ok && data.status === 'success') {
        setConnectionTested(true);
        toast({
          title: "Success",
          description: "CalDAV connection successful!"
        });
        
        // Automatically load calendars after successful connection
        await loadCalendars();
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to CalDAV server",
          variant: "destructive"
        });
        console.error('CalDAV connection failed:', data);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Error",
        description: "Failed to test CalDAV connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const loadCalendars = async () => {
    if (!serverUrl || !username || !password) {
      return;
    }

    try {
      setIsLoadingCalendars(true);
      
      const response = await fetch(`${API_BASE}/sync/config/caldav/calendars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server_url: serverUrl,
          username: username,
          password: password
        })
      });

      const data = await response.json();
      console.log('CalDAV calendars response:', { status: response.status, data });

      if (response.ok) {
        setAvailableCalendars(data.calendars || []);
        
        // Auto-select first calendar if available
        if (data.calendars && data.calendars.length > 0) {
          setSelectedCalendarUrl(data.calendars[0].url);
        }
        
        toast({
          title: "Success",
          description: `Found ${data.calendars?.length || 0} calendars`
        });
      } else {
        toast({
          title: "Error",
          description: data.detail || "Failed to load calendars",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Load calendars error:', error);
      toast({
        title: "Error",
        description: "Failed to load CalDAV calendars",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const configureDestination = async () => {
    if (!serverUrl || !username || !password || !selectedCalendarUrl) {
      toast({
        title: "Error",
        description: "Please complete all fields and select a calendar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsConfiguring(true);
      
      const response = await fetch(`${API_BASE}/sync/config/destination/caldav`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server_url: serverUrl,
          username: username,
          password: password,
          calendar_url: selectedCalendarUrl,
          calendar_name: calendarName
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        toast({
          title: "Success",
          description: "CalDAV destination configured successfully!"
        });

        if (onDestinationConfigured) {
          onDestinationConfigured(data.destination);
        }
      } else {
        toast({
          title: "Error",
          description: data.detail || "Failed to configure CalDAV destination",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Configuration error:', error);
      toast({
        title: "Error",
        description: "Failed to configure CalDAV destination",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  // If already configured, show status
  if (currentDestination && currentDestination.provider_type === 'caldav') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            CalDAV (Mailcow) Configured
          </CardTitle>
          <CardDescription>
            Your Mailcow calendar is set up and ready to receive events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {currentDestination.name || 'Mailcow Calendar'}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Server: {currentDestination.connection_info?.server_url}
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
            
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                All calendar events from your remote agents will be synchronized to your Mailcow calendar.
                Your 9,095 Outlook events are ready to sync!
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => {
                setConnectionTested(false);
                setAvailableCalendars([]);
                if (onDestinationConfigured) {
                  onDestinationConfigured(null);
                }
              }} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Reconfigure Destination
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure CalDAV (Mailcow) Destination</CardTitle>
        <CardDescription>
          Set up your Mailcow server to receive your 9,095 Outlook events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Server Connection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
              1
            </div>
            <h4 className="font-medium">Server Connection</h4>
          </div>
          
          <div className="ml-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-url">CalDAV Server URL</Label>
              <Input
                id="server-url"
                placeholder="https://mail.yourdomain.com/SOGo/dav/"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="your-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="your-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={testConnection} 
              disabled={isTestingConnection || !serverUrl || !username || !password}
              className="w-full"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {connectionTested && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Connection successful! Calendars loaded automatically.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Step 2: Calendar Selection */}
        {connectionTested && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-medium">
                2
              </div>
              <h4 className="font-medium">Select Target Calendar</h4>
            </div>
            
            <div className="ml-8 space-y-4">
              {availableCalendars.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="calendar-select">Available Calendars</Label>
                  <Select value={selectedCalendarUrl} onValueChange={setSelectedCalendarUrl}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCalendars.map((calendar, index) => (
                        <SelectItem key={index} value={calendar.url}>
                          {calendar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No calendars found. Make sure your Mailcow server has CalDAV enabled and calendars created.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="calendar-name">Destination Name</Label>
                <Input
                  id="calendar-name"
                  placeholder="Mailcow Calendar"
                  value={calendarName}
                  onChange={(e) => setCalendarName(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={configureDestination}
                disabled={isConfiguring || !selectedCalendarUrl}
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {isConfiguring ? 'Configuring...' : 'Configure CalDAV Destination'}
              </Button>
            </div>
          </div>
        )}

        {/* Help Information */}
        <Alert>
          <Server className="h-4 w-4" />
          <AlertDescription>
            <strong>Mailcow CalDAV URL format:</strong><br/>
            Usually: <code>https://mail.yourdomain.com/SOGo/dav/</code><br/>
            Alternative: <code>https://yourdomain.com/SOGo/dav/</code>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}