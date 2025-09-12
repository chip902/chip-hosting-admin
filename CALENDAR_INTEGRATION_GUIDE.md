# Calendar Integration Guide

This guide explains how to integrate the enhanced calendar services (Apple Calendar and Exchange Web Services) into your Chip Hosting Admin application.

## Overview

The enhanced calendar integration provides direct access to:
- **Apple Calendar** via AppleScript and SQLite database access
- **Exchange Web Services** via the `exchangelib` Python library
- **Seamless integration** with existing calendar components

## Files Created

### 1. Enhanced Calendar Integration Component
**Location**: `/components/calendar/EnhancedCalendarIntegration.tsx`

A comprehensive React component that provides:
- Apple Calendar access with automatic method detection
- Exchange Web Services configuration and connection
- Event viewing and calendar management
- Real-time status updates

### 2. Enhanced Calendar Hook
**Location**: `/app/hooks/useEnhancedCalendar.ts`

A TypeScript hook that manages:
- State management for both Apple and Exchange calendars
- Async operations for fetching calendars and events
- Error handling and loading states
- Data export in standard FullCalendar format

### 3. Calendar Integration Bridge
**Location**: `/components/calendar/CalendarIntegrationBridge.tsx`

A bridge component that:
- Connects enhanced services to existing calendar system
- Provides auto-refresh capabilities
- Offers both quick and advanced configuration options
- Manages sync operations across multiple providers

## Setup Instructions

### 1. Environment Configuration

Add to your `.env.local` file:

```bash
# Chroniton Capacitor API URL
NEXT_PUBLIC_CHRONITON_API_URL=http://localhost:8008/api
```

### 2. Start the Chroniton Capacitor API

In the chroniton-capacitor directory:

```bash
cd /Users/andrew/code/chroniton-capacitor
python -m src.main
```

The API will start on `http://localhost:8008`

### 3. Integration Options

#### Option A: Full Enhanced Interface

```tsx
import EnhancedCalendarIntegration from '@/components/calendar/EnhancedCalendarIntegration';

export default function CalendarPage() {
  return <EnhancedCalendarIntegration />;
}
```

#### Option B: Bridge Component (Recommended)

```tsx
import CalendarIntegrationBridge from '@/components/calendar/CalendarIntegrationBridge';

export default function CalendarPage() {
  const handleEventsUpdate = (events) => {
    console.log('New events from enhanced sources:', events);
    // Integrate with your existing calendar display
  };

  return (
    <CalendarIntegrationBridge 
      onEventsUpdate={handleEventsUpdate}
      showFullInterface={false}
    />
  );
}
```

#### Option C: Custom Hook Integration

```tsx
import { useEnhancedCalendar } from '@/app/hooks/useEnhancedCalendar';

export default function MyCalendarComponent() {
  const [enhancedState, enhancedActions] = useEnhancedCalendar();

  // Access Apple Calendar
  useEffect(() => {
    if (enhancedState.appleAvailable) {
      enhancedActions.fetchAppleCalendars();
    }
  }, [enhancedState.appleAvailable]);

  // Your custom implementation
  return <div>Custom calendar integration</div>;
}
```

### 4. Integration with Existing Calendar System

To integrate with your existing `CalendarSyncIntegration.tsx`:

```tsx
import CalendarIntegrationBridge from '@/components/calendar/CalendarIntegrationBridge';

export default function CalendarSyncIntegration({ onEventsLoaded }) {
  const [enhancedEvents, setEnhancedEvents] = useState([]);

  const handleEnhancedEventsUpdate = (events) => {
    setEnhancedEvents(events);
    // Merge with existing events
    const allEvents = [...existingEvents, ...events];
    onEventsLoaded(allEvents);
  };

  return (
    <div className="space-y-6">
      {/* Existing OAuth calendar integration */}
      <YourExistingCalendarComponent />
      
      {/* Enhanced calendar integration */}
      <CalendarIntegrationBridge 
        onEventsUpdate={handleEnhancedEventsUpdate}
      />
    </div>
  );
}
```

## Features

### Apple Calendar Integration
- **Automatic detection** of best access method (AppleScript or SQLite)
- **Multiple calendar support** - list and access all user calendars
- **Event extraction** with full metadata (title, time, location, participants)
- **Real-time status** showing availability and access method

### Exchange Web Services Integration
- **Flexible server configuration** with support for various Exchange versions
- **Connection testing** before attempting calendar operations
- **Full event details** including organizer and participant information
- **Secure credential handling** with SSL verification options

### Bridge Components
- **Auto-refresh** capabilities with configurable intervals
- **Sync status tracking** with last sync time and progress indicators
- **Error handling** with user-friendly messages
- **Integration settings** with enable/disable toggles per service

## API Endpoints

The enhanced integration connects to these Chroniton Capacitor endpoints:

- `GET /api/apple/calendars` - List Apple calendars
- `GET /api/apple/events/{calendar_id}` - Get Apple calendar events
- `POST /api/exchange/calendars` - List Exchange calendars (with config)
- `POST /api/exchange/events/{calendar_id}` - Get Exchange events (with config)

## Troubleshooting

### Apple Calendar Issues
- **"Not Available"**: Ensure you're on macOS with Calendar.app installed
- **No calendars found**: Calendar.app may need to be opened at least once
- **Permission errors**: macOS may require accessibility permissions

### Exchange Issues  
- **Connection failed**: Verify server URL, credentials, and network connectivity
- **SSL errors**: Try disabling SSL verification for testing
- **Authentication errors**: Ensure username/password are correct and account has calendar access

### Integration Issues
- **Events not showing**: Check browser console for API errors
- **Sync failures**: Verify Chroniton Capacitor API is running on correct port
- **Missing data**: Ensure proper date ranges are set in fetch requests

## Next Steps

1. **Start the Chroniton Capacitor API** if not already running
2. **Add environment variables** to your `.env.local` file  
3. **Import and use** the integration components in your calendar pages
4. **Test the integration** with your existing calendar data
5. **Configure auto-refresh** and other settings as needed

The enhanced calendar integration is now ready to provide seamless access to Apple Calendar and Exchange Web Services alongside your existing OAuth-based calendar providers!