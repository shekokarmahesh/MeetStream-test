import { useState, useEffect, useCallback } from 'react';
import { createMCPClient, DynamicMCPClient } from '@/lib/mcpClient';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  duration: string;
  attendees: string[];
  description?: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

export function useCalendarMCP(accessToken: string | null) {
  const [mcpClient, setMcpClient] = useState<DynamicMCPClient | null>(null);
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize MCP client when access token is available
  useEffect(() => {
    if (!accessToken) {
      setState('disconnected');
      setMcpClient(null);
      return;
    }

    const initializeClient = async () => {
      setState('connecting');
      setError(null);

      try {
        const client = createMCPClient(accessToken);
        await client.connect();
        setMcpClient(client);
        setState('connected');
      } catch (err) {
        console.error('Failed to initialize MCP client:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setState('failed');
      }
    };

    initializeClient();

    // Cleanup on unmount or token change
    return () => {
      if (mcpClient) {
        mcpClient.disconnect().catch(console.error);
      }
    };
  }, [accessToken]);

  const fetchEvents = useCallback(async () => {
    if (!mcpClient || state !== 'connected') {
      console.log('Cannot fetch events: client not ready');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Look 30 days ahead

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30); // Look 30 days back

      // Fetch upcoming events
      const upcomingEventsData = await mcpClient.fetchCalendarEvents({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: futureDate.toISOString(),
        maxResults: 10,
      });

      // Fetch past events
      const pastEventsData = await mcpClient.fetchCalendarEvents({
        calendarId: 'primary',
        timeMin: pastDate.toISOString(),
        timeMax: now.toISOString(),
        maxResults: 10,
      });

      // Sort past events in reverse chronological order
      const sortedPastEvents = pastEventsData.sort((a, b) => {
        const dateA = new Date(a.start).getTime();
        const dateB = new Date(b.start).getTime();
        return dateB - dateA; // Descending order
      });

      setUpcomingEvents(upcomingEventsData);
      setPastEvents(sortedPastEvents);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [mcpClient, state]);

  const createTestEvent = useCallback(async () => {
    if (!mcpClient || state !== 'connected') {
      console.log('Cannot create event: client not ready');
      return;
    }

    setLoading(true);
    try {
      // Create an event 1 hour from now
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      await mcpClient.createCalendarEvent({
        calendarId: 'primary',
        summary: 'Test Meeting via Katalyst',
        description: 'This is a test event created through the Katalyst app with dynamic OAuth',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
      });

      // Refresh events list
      await fetchEvents();
      setError(null);
    } catch (err) {
      console.error('Error creating test event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }, [mcpClient, state, fetchEvents]);

  const retry = useCallback(async () => {
    if (!accessToken) {
      setError('Access token not available');
      return;
    }

    setState('connecting');
    setError(null);

    try {
      const client = createMCPClient(accessToken);
      await client.connect();
      setMcpClient(client);
      setState('connected');
    } catch (err) {
      console.error('Failed to reconnect:', err);
      setError(err instanceof Error ? err.message : 'Failed to reconnect');
      setState('failed');
    }
  }, [accessToken]);

  return {
    state,
    error,
    upcomingEvents,
    pastEvents,
    loading,
    fetchEvents,
    createTestEvent,
    retry,
    isReady: state === 'connected',
  };
}

