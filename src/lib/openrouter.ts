interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

class OpenRouterService {
  private config: OpenRouterConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      baseUrl: import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: import.meta.env.VITE_CONTRACT_PARSER_MODEL || 'google/gemma-3-12b-it:free'
    };
  }

  async generateMeetingSummary(meetingData: {
    title: string;
    description?: string;
    duration: string;
    attendees: string[];
    startTime: string;
    endTime: string;
  }): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = this.createSummaryPrompt(meetingData);
    
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Katalyst Calendar Assistant'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that creates concise, professional meeting summaries. Format your response with clear sections using **bold headers** for main topics like **Meeting Summary**, **Objective**, **Duration & Timing**, **Key Details**, and **Follow-up**. Keep summaries under 200 words and use structured formatting for better readability.'
            } as OpenRouterMessage,
            {
              role: 'user',
              content: prompt
            } as OpenRouterMessage
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      return data.choices[0]?.message?.content || 'Unable to generate summary';
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      throw error;
    }
  }

  private createSummaryPrompt(meetingData: {
    title: string;
    description?: string;
    duration: string;
    attendees: string[];
    startTime: string;
    endTime: string;
  }): string {
    const attendeesList = meetingData.attendees.length > 0 
      ? meetingData.attendees.join(', ') 
      : 'No attendees listed';

    return `Please create a concise summary for this meeting:

**Meeting Title:** ${meetingData.title}
**Duration:** ${meetingData.duration}
**Time:** ${new Date(meetingData.startTime).toLocaleString()} - ${new Date(meetingData.endTime).toLocaleString()}
**Attendees:** ${attendeesList}
**Description:** ${meetingData.description || 'No description provided'}

Generate a well-structured professional summary with clear sections:

**Meeting Summary:** [Brief title/overview]
**Objective:** [Main purpose and goals]
**Duration & Timing:** [When and how long]
**Key Details:** [Important information from description]
**Follow-up:** [Recommended next steps or action items]

Use **bold formatting** for section headers and keep each section concise and informative.`;
  }
}

export const openRouterService = new OpenRouterService();
