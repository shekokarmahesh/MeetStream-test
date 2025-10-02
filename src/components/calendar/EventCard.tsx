import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, FileText, Sparkles, Loader2 } from 'lucide-react';
import { useAISummary } from '@/hooks/useAISummary';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    start: string;
    end: string;
    duration: string;
    attendees: string[];
    description?: string;
  };
}

export function EventCard({ event }: EventCardProps) {
  const { generateSummary, getSummaryState } = useAISummary();
  const summaryState = getSummaryState(event.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = new Date(event.start) > new Date();

  const handleGenerateSummary = () => {
    generateSummary(event.id, {
      title: event.title,
      description: event.description,
      duration: event.duration,
      attendees: event.attendees,
      startTime: event.start,
      endTime: event.end
    });
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight pr-4">{event.title}</CardTitle>
          <div className="flex items-center space-x-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={summaryState.isLoading}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="Generate AI Summary"
            >
              {summaryState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
            <Badge 
              variant={isUpcoming ? "default" : "secondary"} 
              className="text-xs"
            >
              {isUpcoming ? "Upcoming" : "Past"}
            </Badge>
          </div>
        </div>
        <CardDescription className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(event.start)}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{event.duration}</span>
          </div>
          
          {event.attendees.length > 0 && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{event.attendees.length} attendees</span>
            </div>
          )}
        </div>
        
        {event.description && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                <span>Description</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>
          </>
        )}

        {summaryState.summary && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600">AI Summary</span>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                  {summaryState.summary.split('\n\n').map((paragraph, index) => {
                    // Handle different formatting patterns
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      // Bold headers
                      const text = paragraph.replace(/\*\*/g, '');
                      return (
                        <h4 key={index} className="font-semibold text-gray-800 text-base">
                          {text}
                        </h4>
                      );
                    } else if (paragraph.includes('**')) {
                      // Mixed formatting with bold sections
                      const parts = paragraph.split(/(\*\*[^*]+\*\*)/);
                      return (
                        <p key={index} className="leading-relaxed">
                          {parts.map((part, partIndex) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <span key={partIndex} className="font-semibold text-gray-800">
                                  {part.replace(/\*\*/g, '')}
                                </span>
                              );
                            }
                            return <span key={partIndex}>{part}</span>;
                          })}
                        </p>
                      );
                    } else {
                      // Regular paragraphs
                      return (
                        <p key={index} className="leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {summaryState.error && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-red-600">
                <Sparkles className="h-4 w-4" />
                <span>AI Summary Error</span>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-sm text-red-700">
                  {summaryState.error}
                </p>
              </div>
            </div>
          </>
        )}
        
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>
            {formatTime(event.start)} - {formatTime(event.end)}
          </span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isUpcoming ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isUpcoming ? 'Active' : 'Completed'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



