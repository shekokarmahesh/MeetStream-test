import { useState } from 'react';
import { openRouterService } from '@/lib/openrouter';

interface MeetingData {
  title: string;
  description?: string;
  duration: string;
  attendees: string[];
  startTime: string;
  endTime: string;
}

interface SummaryState {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useAISummary = () => {
  const [summaries, setSummaries] = useState<Record<string, SummaryState>>({});

  const generateSummary = async (eventId: string, meetingData: MeetingData) => {
    // Set loading state
    setSummaries(prev => ({
      ...prev,
      [eventId]: {
        summary: null,
        isLoading: true,
        error: null
      }
    }));

    try {
      const summary = await openRouterService.generateMeetingSummary(meetingData);
      
      setSummaries(prev => ({
        ...prev,
        [eventId]: {
          summary,
          isLoading: false,
          error: null
        }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
      
      setSummaries(prev => ({
        ...prev,
        [eventId]: {
          summary: null,
          isLoading: false,
          error: errorMessage
        }
      }));
    }
  };

  const getSummaryState = (eventId: string): SummaryState => {
    return summaries[eventId] || {
      summary: null,
      isLoading: false,
      error: null
    };
  };

  const clearSummary = (eventId: string) => {
    setSummaries(prev => {
      const newSummaries = { ...prev };
      delete newSummaries[eventId];
      return newSummaries;
    });
  };

  return {
    generateSummary,
    getSummaryState,
    clearSummary
  };
};
