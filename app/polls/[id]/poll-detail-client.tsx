'use client';

import { useState, useEffect } from 'react';
import { Poll } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Users, Clock, Vote, Eye } from 'lucide-react';
import { useOptionalAuth } from '@/contexts/auth-context';
import { submitVoteAction } from '@/lib/actions/poll-actions';
import { PollResults } from '@/components/polls/poll-results';
import { QRCodeComponent } from '@/components/polls/qr-code';
import { SharePoll } from '@/components/polls/share-poll';
import { supabase } from '@/lib/supabase';

interface PollDetailClientProps {
  poll: Poll;
}

export function PollDetailClient({ poll: initialPoll }: PollDetailClientProps) {
  const { user } = useOptionalAuth();
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);

  const pollUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/polls/${poll.id}`;

  // Set up real-time subscription for vote updates
  useEffect(() => {
    const channel = supabase
      .channel(`poll-${poll.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `poll_id=eq.${poll.id}`,
        },
        async () => {
          // Refetch poll data when a new vote is added
          try {
            // Since we can't call Server Actions directly from useEffect,
            // we'll fetch the updated data using the Supabase client
            const { data: updatedPoll, error } = await supabase
              .from('polls')
              .select(`
                *,
                options:poll_options(*),
                votes:votes(id, option_id)
              `)
              .eq('id', poll.id)
              .single();

            if (!error && updatedPoll) {
              // Transform the data to match our Poll type
              const transformedPoll: Poll = {
                ...updatedPoll,
                totalVotes: updatedPoll.votes?.length || 0,
                options: updatedPoll.options?.map((option: any) => ({
                  ...option,
                  votes: updatedPoll.votes?.filter((vote: any) => vote.option_id === option.id).length || 0
                })) || []
              };
              setPoll(transformedPoll);
            }
          } catch (error) {
            console.error('Error fetching updated poll:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll.id]);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pollId', poll.id);
      formData.append('optionIndex', selectedOption);
      
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
              <QRCodeComponent pollId={poll.id} pollTitle={poll.title} />
              <SharePoll pollId={poll.id} pollTitle={poll.title} />
            </div>
          </div>
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
                Created {new Date(poll.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                By {poll.createdBy || 'Anonymous'}
              </span>
            </div>
            {poll.expiresAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Expires {new Date(poll.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Poll Settings */}
          <div className="flex flex-wrap gap-2 mb-6">
            {poll.settings?.requireLogin && (
              <Badge variant="secondary">
                Login Required
              </Badge>
            )}
            {poll.settings?.allowMultipleSelections && (
              <Badge variant="secondary">
                Multiple Selections Allowed
              </Badge>
            )}
            <Badge variant={poll.isActive ? "default" : "secondary"}>
              {poll.isActive ? 'Active' : 'Inactive'}
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
              {poll.isActive ? (
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
                        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                          {poll.options.map((option, index) => (
                            <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                {option.text}
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