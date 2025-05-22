'use client';

import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { formatDate } from '@fullcalendar/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CalendarToolbarProps {
  title: string;
  onViewChange: (view: string) => void;
  onNavigate: (action: 'prev' | 'next' | 'today') => void;
  currentView: string;
}

const CalendarToolbar = ({
  title,
  onViewChange,
  onNavigate,
  currentView,
}: CalendarToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('prev')}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          className="h-8"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('next')}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="ml-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      </div>
      
      <Tabs
        value={currentView}
        onValueChange={onViewChange}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dayGridMonth">Month</TabsTrigger>
          <TabsTrigger value="timeGridWeek">Week</TabsTrigger>
          <TabsTrigger value="timeGridDay">Day</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

interface CalendarComponentProps {
  initialView?: string;
  events?: Array<{
    id: string;
    title: string;
    start: Date | string;
    end?: Date | string;
    allDay?: boolean;
    color?: string;
  }>;
  onEventClick?: (event: any) => void;
  onDateClick?: (date: Date) => void;
  onEventDrop?: (event: any) => void;
  onEventResize?: (event: any) => void;
}

export default function CalendarComponent({
  initialView = 'dayGridMonth',
  events = [],
  onEventClick,
  onDateClick,
  onEventDrop,
  onEventResize,
}: CalendarComponentProps) {
  const [currentView, setCurrentView] = useState(initialView);
  const [title, setTitle] = useState('');
  const calendarRef = useRef<any>(null);

  useEffect(() => {
    updateTitle();
  }, [currentView]);

  const updateTitle = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      let title = '';

      if (currentView === 'dayGridMonth') {
        title = formatDate(calendarApi.getDate(), { month: 'long', year: 'numeric' });
      } else if (currentView === 'timeGridWeek') {
        const start = formatDate(view.currentStart, { month: 'short', day: 'numeric' });
        const end = formatDate(view.currentEnd, { day: 'numeric', year: 'numeric' });
        title = `${start} - ${end}`;
      } else {
        title = formatDate(calendarApi.getDate(), { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric' 
        });
      }

      setTitle(title);
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleNavigate = (action: 'prev' | 'next' | 'today') => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      
      if (action === 'prev') {
        calendarApi.prev();
      } else if (action === 'next') {
        calendarApi.next();
      } else {
        calendarApi.today();
      }
      
      updateTitle();
    }
  };

  const handleEventClick = (clickInfo: any) => {
    if (onEventClick) {
      onEventClick(clickInfo.event);
    }
  };

  const handleDateClick = (arg: any) => {
    if (onDateClick) {
      onDateClick(arg.date);
    }
  };

  const handleEventDrop = (dropInfo: any) => {
    if (onEventDrop) {
      onEventDrop(dropInfo);
    }
  };

  const handleEventResize = (resizeInfo: any) => {
    if (onEventResize) {
      onEventResize(resizeInfo);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CalendarToolbar
        title={title}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        currentView={currentView}
      />
      
      <div className="flex-grow rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={false}
          height="auto"
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          nowIndicator={true}
          initialDate={new Date()}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={currentView !== 'timeGridDay'}
          dayHeaderFormat={{ weekday: 'short' }}
          dayHeaderClassNames="text-gray-600 dark:text-gray-400 font-medium"
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
          }}
          eventClassNames="cursor-pointer"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            meridiem: 'short',
          }}
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' },
              dayMaxEventRows: 3,
            },
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
              dayHeaderFormat: { weekday: 'short', day: 'numeric' },
            },
            timeGridDay: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
            },
          }}
        />
      </div>
    </div>
  );
}
