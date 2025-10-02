interface MCPClientConfig {
  serverUrl: string;
  accessToken: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  duration: string;
  attendees: string[];
  description?: string;
}

/**
 * Creates a dynamic MCP client instance with user's OAuth token
 * Uses direct HTTP calls instead of MCP SDK transport for compatibility
 */
export class DynamicMCPClient {
  private serverUrl: string;
  private accessToken: string;
  private isConnected: boolean = false;

  constructor(config: MCPClientConfig) {
    this.serverUrl = config.serverUrl;
    this.accessToken = config.accessToken;
  }

  /**
   * Connect to MCP server (validate token and endpoint)
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Mark as connected - we'll validate when we make actual requests
      // Composio MCP doesn't support connection test requests
      this.isConnected = true;
      console.log('✅ MCP client initialized with token');
    } catch (error) {
      console.error('❌ Failed to connect MCP client:', error);
      throw new Error('Failed to connect to calendar service. Please check your connection.');
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    this.isConnected = false;
    console.log('MCP client disconnected');
  }

  /**
   * Check if client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * List available tools (not used with direct API calls)
   */
  async listTools() {
    // Return mock tools list - we'll use Google Calendar API directly
    return [
      { name: 'GOOGLECALENDAR_LIST_EVENTS', description: 'List calendar events' },
      { name: 'GOOGLECALENDAR_CREATE_EVENT', description: 'Create calendar event' }
    ];
  }

  /**
   * Call a tool - uses Google Calendar API directly
   */
  async callTool(toolName: string, args: Record<string, any>) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      console.log(`📞 Calling ${toolName}`, args);
      
      // Map tool names to Google Calendar API endpoints
      if (toolName.includes('LIST_EVENTS') || toolName.toLowerCase().includes('list')) {
        return await this.listEventsDirectly(args);
      } else if (toolName.includes('CREATE_EVENT') || toolName.toLowerCase().includes('create')) {
        return await this.createEventDirectly(args);
      }
      
      throw new Error(`Unknown tool: ${toolName}`);
    } catch (error) {
      console.error(`❌ Error calling ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * List events using Google Calendar API directly
   */
  private async listEventsDirectly(args: Record<string, any>) {
    const params = new URLSearchParams({
      calendarId: args.calendarId || 'primary',
      timeMin: args.timeMin,
      timeMax: args.timeMax,
      maxResults: String(args.maxResults || 10),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const url = `https://www.googleapis.com/calendar/v3/calendars/${args.calendarId || 'primary'}/events?${params}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar API error:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Got ${data.items?.length || 0} events`);
    
    // Return in MCP format
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          successful: true,
          data: {
            items: data.items || []
          }
        })
      }]
    };
  }

  /**
   * Create event using Google Calendar API directly
   */
  private async createEventDirectly(args: Record<string, any>) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${args.calendarId || 'primary'}/events`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: args.summary,
        description: args.description,
        start: args.start,
        end: args.end,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar API error:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Event created:`, data.id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          successful: true,
          data: data
        })
      }]
    };
  }

  /**
   * Fetch calendar events
   */
  async fetchCalendarEvents(params: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }): Promise<CalendarEvent[]> {
    try {
      // Find the list events tool
      const tools = await this.listTools();
      const listEventsTool = tools.find(
        (t: any) => t.name.toLowerCase().includes('list') && t.name.toLowerCase().includes('event')
      );

      if (!listEventsTool) {
        throw new Error('Calendar list events tool not found');
      }

      const result = await this.callTool(listEventsTool.name, {
        calendarId: params.calendarId || 'primary',
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        maxResults: params.maxResults || 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return this.parseCalendarEvents(result);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  /**
   * Parse calendar events from MCP response
   */
  private parseCalendarEvents(result: any): CalendarEvent[] {
    try {
      // Parse Composio MCP response format
      if (result?.content && Array.isArray(result.content) && result.content[0]?.text) {
        const textData = result.content[0].text;
        const parsed = JSON.parse(textData);

        if (parsed.successful && parsed.data?.items) {
          return parsed.data.items.map((event: any) => ({
            id: event.id,
            title: event.summary || 'No title',
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            duration: this.calculateDuration(event.start, event.end),
            attendees: event.attendees?.map((a: any) => a.email) || [],
            description: event.description,
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Error parsing calendar events:', error);
      return [];
    }
  }

  /**
   * Calculate event duration
   */
  private calculateDuration(start: any, end: any): string {
    const startTime = new Date(start?.dateTime || start?.date);
    const endTime = new Date(end?.dateTime || end?.date);
    const minutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(params: {
    calendarId?: string;
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
  }): Promise<any> {
    try {
      const tools = await this.listTools();
      const createEventTool = tools.find(
        (t: any) => t.name === 'GOOGLECALENDAR_CREATE_EVENT'
      );

      if (!createEventTool) {
        throw new Error('Calendar create event tool not found');
      }

      const result = await this.callTool(createEventTool.name, {
        calendarId: params.calendarId || 'primary',
        ...params,
      });

      return result;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create MCP client with user's OAuth token
 */
export const createMCPClient = (accessToken: string): DynamicMCPClient => {
  const serverUrl = import.meta.env.VITE_MCP_SERVER_URL;
  
  if (!serverUrl) {
    throw new Error('MCP server URL not configured');
  }

  if (!accessToken) {
    throw new Error('Access token required to create MCP client');
  }

  return new DynamicMCPClient({
    serverUrl,
    accessToken,
  });
};

