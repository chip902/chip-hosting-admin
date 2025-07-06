'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  Calendar
} from 'lucide-react';
import { useToast } from '@/app/hooks/useToast';
import { useGoogleCalendarSetup } from '@/app/hooks/useCalendarSync';

interface GoogleDestinationSetupProps {
  onDestinationConfigured?: (destination: any) => void;
  currentDestination?: any;
}

export default function GoogleDestinationSetup({ 
  onDestinationConfigured, 
  currentDestination 
}: GoogleDestinationSetupProps) {
  const [authCode, setAuthCode] = useState('');
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [customCalendarId, setCustomCalendarId] = useState('c_32df4c9cbd5f0f18217a19233b1ed2eea7327ad60b998346dcee74ccdc2a5495@group.calendar.google.com');
  const [useCustomCalendar, setUseCustomCalendar] = useState(false);
  
  const { toast } = useToast();
  
  const {
    authUrl,
    credentials,
    availableCalendars,
    getAuthUrl,
    exchangeCode,
    isGettingAuthUrl,
    isExchangingCode,
    isLoadingCalendars,
    authUrlError,
    exchangeError,
    calendarsError,
    reset
  } = useGoogleCalendarSetup();

  const API_BASE = 'http://chepurny.com:8008';

  const configureGoogleDestination = async () => {
    if (!credentials) {
      toast({
        title: "Error",
        description: "Please complete Google authorization first",
        variant: "destructive"
      });
      return;
    }

    const calendarId = useCustomCalendar ? customCalendarId : selectedCalendarId;
    
    if (!calendarId) {
      toast({
        title: "Error",
        description: "Please select or enter a calendar ID",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/sync/config/destination/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendar_id: calendarId,
          credentials: credentials
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Google Calendar destination configured successfully!"
      });

      if (onDestinationConfigured) {
        onDestinationConfigured(data.destination);
      }

    } catch (error) {
      console.error('Configuration error:', error);
      toast({
        title: "Error",
        description: "Failed to configure Google Calendar destination",
        variant: "destructive"
      });
    }
  };

  const copyCalendarId = async () => {
    try {
      await navigator.clipboard.writeText(customCalendarId);
      toast({
        title: "Copied",
        description: "Calendar ID copied to clipboard"
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleExchangeCode = () => {
    if (!authCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the authorization code",
        variant: "destructive"
      });
      return;
    }
    exchangeCode(authCode.trim());
  };

  // If already configured, show status
  if (currentDestination) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Google Calendar Configured
          </CardTitle>
          <CardDescription>
            Your destination calendar is set up and ready to receive events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {currentDestination.name || 'Google Calendar Destination'}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Calendar ID: {currentDestination.calendar_id}
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
            
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                All calendar events from your remote agents will be synchronized to this Google Calendar.
                Your 9,095 Outlook events are ready to sync!
              </AlertDescription>
            </Alert>

            <Button 
              onClick={reset} 
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
        <CardTitle>Configure Google Calendar Destination</CardTitle>
        <CardDescription>
          Set up where your 9,095 Outlook events will be synchronized
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Authorization */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
              1
            </div>
            <h4 className="font-medium">Google Authorization</h4>
          </div>
          
          <div className="ml-8 space-y-2">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                getAuthUrl();
              }} 
              disabled={isGettingAuthUrl}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {isGettingAuthUrl ? 'Generating...' : 'Get Authorization URL'}
            </Button>
            
            {authUrl && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Click the link below to authorize Google Calendar access:
                </p>
                <Button variant="link" asChild className="h-auto p-0 text-blue-600">
                  <a href={authUrl} target="_blank" rel="noopener noreferrer">
                    Open Google Authorization Page
                  </a>
                </Button>
              </div>
            )}
            
            {authUrlError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to generate authorization URL. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Step 2: Enter Code */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-medium ${
              authUrl ? 'bg-blue-500' : 'bg-gray-400'
            }`}>
              2
            </div>
            <h4 className="font-medium">Authorization Code</h4>
          </div>
          
          <div className="ml-8 space-y-2">
            <Input
              placeholder="Paste authorization code here"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              disabled={!authUrl}
            />
            <Button 
              onClick={handleExchangeCode} 
              disabled={!authCode || isExchangingCode}
              className="w-full"
            >
              {isExchangingCode ? 'Exchanging...' : 'Exchange Code for Tokens'}
            </Button>
            
            {exchangeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to exchange authorization code. Please try again with a fresh code.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Step 3: Select Calendar */}
        {credentials && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-medium">
                3
              </div>
              <h4 className="font-medium">Select Destination Calendar</h4>
            </div>
            
            <div className="ml-8 space-y-4">
              {/* Quick Setup with your calendar */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <h5 className="font-medium text-green-900 dark:text-green-100">
                    Quick Setup - Use Your Calendar
                  </h5>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  We detected you created a calendar for this sync. Click to use it:
                </p>
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border text-sm font-mono">
                  <span className="flex-1 truncate">{customCalendarId}</span>
                  <Button onClick={copyCalendarId} size="sm" variant="ghost">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={() => {
                    setUseCustomCalendar(true);
                    setSelectedCalendarId('');
                    configureGoogleDestination();
                  }}
                  className="w-full mt-3"
                >
                  Use This Calendar for Sync
                </Button>
              </div>

              {/* Alternative: Choose from available calendars */}
              {availableCalendars.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-medium">Or choose from your calendars:</h5>
                  <Select 
                    value={selectedCalendarId} 
                    onValueChange={setSelectedCalendarId}
                    disabled={useCustomCalendar}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCalendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.summary} {calendar.primary && '(Primary)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={() => {
                      setUseCustomCalendar(false);
                      configureGoogleDestination();
                    }}
                    disabled={!selectedCalendarId}
                    variant="outline"
                    className="w-full"
                  >
                    Configure Selected Calendar
                  </Button>
                </div>
              )}

              {isLoadingCalendars && (
                <Alert>
                  <AlertDescription>
                    Loading your Google calendars...
                  </AlertDescription>
                </Alert>
              )}

              {calendarsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load calendars. You can still use the custom calendar ID above.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Success State */}
        {credentials && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Google Calendar authorization successful! Select a calendar above to complete the setup.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}