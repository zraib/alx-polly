'use client';

import { useState } from 'react';
import { Poll } from '@/types';
import { submitVoteAction } from '@/lib/actions/poll-actions';
import { PollResults } from '@/components/polls/poll-results';
import { QRCodeComponent } from '@/components/polls/qr-code';
import { SharePoll } from '@/components/polls/share-poll';
import { useOptionalAuth } from '@/contexts/auth-context';
import { useRealtimePoll } from '@/hooks/use-realtime-poll';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Users, Clock, Vote, Eye, CheckCircle, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useCSRFToken, CSRFToken } from '@/components/csrf-token';

interface PollDetailClientProps {
  poll: Poll;
}

export function PollDetailClient({ poll: initialPoll }: PollDetailClientProps) {
  const { user } = useOptionalAuth();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const { tokens } = useCSRFToken();

  // Use the real-time poll hook
  const { poll, isConnected, connectionError, refetch } = useRealtimePoll({
    pollId: initialPoll.id,
    initialPoll,
    onUpdate: (updatedPoll) => {
      console.log('Poll updated via real-time subscription:', updatedPoll);
    },
    onError: (error) => {
      console.error('Real-time poll error:', error);
      setError('Connection to live updates lost. Data may not be current.');
    }
  });

  const pollUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/polls/${poll.id}`;

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pollId', poll.id);
      formData.append('optionIndex', selectedOption);
      formData.append('csrf_token', tokens?.token || '');
      formData.append('csrf_hash', tokens?.hash || '');
      
      const result = await submitVoteAction(formData);
      
      if (result.success) {
        setHasVoted(true);
        setSelectedOption('');
        // The real-time subscription will handle updating the poll data
      } else {
        setError(result.error || 'Failed to submit vote');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/polls" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Polls
        </Link>
      </div>

      {/* Poll Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription className="text-base">
                  {poll.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isConnected ? "default" : "destructive"} 
                className="flex items-center gap-1"
              >
                {isConnected ? (
                  <><Wifi className="h-3 w-3" /> Live</>
                ) : (
                  <><WifiOff className="h-3 w-3" /> Offline</>
                )}
              </Badge>
              <QRCodeComponent pollId={poll.id} pollTitle={poll.title} />
              <SharePoll pollId={poll.id} pollTitle={poll.title} />
            </div>
          </div>
          {connectionError && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {connectionError} <Button variant="link" className="p-0 h-auto" onClick={refetch}>Retry</Button>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Poll Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Created {new Date(poll.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                By {poll.created_by || 'Anonymous'}
              </span>
            </div>
            {poll.expiration_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Expires {new Date(poll.expiration_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Poll Settings */}
          <div className="flex flex-wrap gap-2 mb-6">
            {poll.require_login && (
              <Badge variant="secondary">
                Login Required
              </Badge>
            )}
            {poll.allow_multiple_selections && (
              <Badge variant="secondary">
                Multiple Selections Allowed
              </Badge>
            )}
            <Badge variant={poll.is_active ? "default" : "secondary"}>
              {poll.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Tabs for Vote/Results */}
          <Tabs defaultValue="vote" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vote" className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                Vote
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vote" className="mt-6">
              {poll.is_active ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Cast Your Vote</CardTitle>
                    <CardDescription>
                      Select your preferred option below
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                        {error}
                      </div>
                    )}
                    
                    {hasVoted ? (
                      <div className="p-4 text-center text-green-600 bg-green-50 border border-green-200 rounded-md">
                        Thank you for voting! Your vote has been recorded.
                      </div>
                    ) : (
                      <form onSubmit={handleVoteSubmit}>
                        <CSRFToken />
                        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                          {poll.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        
                        <Button 
                          type="submit" 
                          disabled={!selectedOption || isSubmitting}
                          className="w-full mt-4"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="p-4 text-center text-muted-foreground bg-muted/50 border border-muted rounded-md">
                  This poll is currently inactive and not accepting votes.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              <PollResults poll={poll} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}