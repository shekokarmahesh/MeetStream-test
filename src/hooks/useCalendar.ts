import { useMcp } from 'use-mcp/react';
import { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  duration: string;
  attendees: string[];
  description?: string;
}

export function useCalendar(mcpServerUrl: string) {
  const {
    state,
    tools,
    error,
    callTool,
    retry,
    authenticate
  } = useMcp({
    url: mcpServerUrl,
    clientName: 'Katalyst',
    autoReconnect: true,
  });

  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Parse Composio MCP response format
  const parseComposioResponse = (result: any): any[] => {
    try {
      // The response comes in format: { content: [{ type: 'text', text: '...' }] }
      if (result?.content && Array.isArray(result.content) && result.content[0]?.text) {
        const textData = result.content[0].text;
        const parsed = JSON.parse(textData);
        
        // Check if successful and return items array
        if (parsed.successful && parsed.data?.items) {
          return parsed.data.items;
        }
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const fetchEvents = async () => {
    if (state !== 'ready') return;
    
    setLoading(true);
    try {
      // Find the correct tool name for listing events
      const listEventsTool = tools?.find(t => 
        t.name.toLowerCase().includes('list') && 
        t.name.toLowerCase().includes('event')
      );
      
      if (!listEventsTool) {
        return;
      }
      
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Look 30 days ahead
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30); // Look 30 days back
      
      // Fetch upcoming events (from now to 30 days ahead)
      const upcomingResult = await callTool(listEventsTool.name, {
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: futureDate.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      // Fetch past events (from 30 days ago to now)
      const pastResult = await callTool(listEventsTool.name, {
        calendarId: 'primary',
        timeMin: pastDate.toISOString(),
        timeMax: now.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      // Parse the Composio response format
      const upcomingEventsRaw = parseComposioResponse(upcomingResult);
      const pastEventsRaw = parseComposioResponse(pastResult);

      const formattedUpcoming = formatEvents(upcomingEventsRaw);
      const formattedPast = formatEvents(pastEventsRaw);

      // Sort past events in reverse chronological order (most recent first)
      const sortedPastEvents = formattedPast.sort((a, b) => {
        const dateA = new Date(a.start).getTime();
        const dateB = new Date(b.start).getTime();
        return dateB - dateA; // Descending order
      });

      setUpcomingEvents(formattedUpcoming);
      setPastEvents(sortedPastEvents);
    } catch (err) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const formatEvents = (events: any[]): CalendarEvent[] => {
    return events.map(event => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      duration: calculateDuration(event.start, event.end),
      attendees: event.attendees?.map((a: any) => a.email) || [],
      description: event.description
    }));
  };

  const calculateDuration = (start: any, end: any): string => {
    const startTime = new Date(start?.dateTime || start?.date);
    const endTime = new Date(end?.dateTime || end?.date);
    const minutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const createTestEvent = async () => {
    if (state !== 'ready') return;
    
    setLoading(true);
    try {
      const createEventTool = tools?.find(t => 
        t.name === 'GOOGLECALENDAR_CREATE_EVENT'
      );
      
      if (!createEventTool) {
        return;
      }

      // Create an event 1 hour from now
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      await callTool(createEventTool.name, {
        calendarId: 'primary',
        summary: 'Test Meeting via Katalyst',
        description: 'This is a test event created through the Katalyst app',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Asia/Kolkata'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Kolkata'
        }
      });
      
      // Refresh events list
      await fetchEvents();
    } catch (err) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  return {
    state,
    error,
    tools,
    upcomingEvents,
    pastEvents,
    loading,
    fetchEvents,
    createTestEvent,
    retry,
    authenticate
  };
}



