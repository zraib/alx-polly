'use client';

import { useState } from 'react';
import { Poll, transformPollForDisplay } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { submitVoteAction } from '@/lib/actions/poll-actions';
import { toast } from '@/components/ui/use-toast';
import { useCSRFToken } from '@/components/csrf-token';

interface PollResultsProps {
  poll: Poll;
  className?: string;
}

export function PollResults({ poll: initialPoll, className }: PollResultsProps) {
  const [poll, setPoll] = useState(initialPoll);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingIndex, setVotingIndex] = useState<number | null>(null);
  const { tokens } = useCSRFToken();
  const token = tokens?.token || '';
  const hash = tokens?.hash || '';
  
  const totalVotes = poll.votes.reduce((sum, count) => sum + count, 0);
  const hasVotes = totalVotes > 0;
  const displayOptions = transformPollForDisplay(poll);

  const handleVote = async (optionIndex: number) => {
    if (votingIndex !== null) return;
    
    setVotingIndex(optionIndex);
    
    // Optimistic update - immediately update UI
    const optimisticPoll = {
      ...poll,
      votes: poll.votes.map((count, index) => 
        index === optionIndex ? count + 1 : count
      )
    };
    setPoll(optimisticPoll);
    
    try {
      const formData = new FormData();
      formData.append('pollId', poll.id);
      formData.append('optionIndex', optionIndex.toString());
      formData.append('csrf_token', token);
      formData.append('csrf_hash', hash);
      
      const result = await submitVoteAction(formData);
      
      if (result.success) {
        setHasVoted(true);
        toast({
          title: "Vote submitted!",
          description: "success" in result && "message" in result ? result.message : "Your vote has been recorded successfully.",
        });
        // Real-time subscription will handle the actual data update
      } else {
        // Revert optimistic update on error
        setPoll(poll);
        toast({
          title: "Error",
          description: result.error || "Failed to submit vote",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setPoll(poll);
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVotingIndex(null);
    }
  };

  // Calculate percentages and sort options by vote count
  const optionsWithPercentages = displayOptions.options.map((option: any, index: number) => ({
    ...option,
    percentage: hasVotes ? (option.votes / totalVotes) * 100 : 0
  })).sort((a, b) => b.votes - a.votes);

  const topOption = optionsWithPercentages[0];
  const averageVotes = hasVotes ? Math.round(totalVotes / displayOptions.options.length) : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Poll Results
              </CardTitle>
              <CardDescription>
                Live results for "{poll.title}"
              </CardDescription>
            </div>
            <Badge variant={poll.is_active ? "default" : "secondary"}>
              {poll.is_active ? "Active" : "Closed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVotes}</p>
                <p className="text-sm text-muted-foreground">Total Votes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayOptions.options.length}</p>
                <p className="text-sm text-muted-foreground">Options</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageVotes}</p>
                <p className="text-sm text-muted-foreground">Avg per Option</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Vote Breakdown</CardTitle>
          <CardDescription>
            {hasVotes ? (
              <>Leading option: <strong>{topOption.text}</strong> with {topOption.votes} votes ({topOption.percentage}%)</>
            ) : (
              "No votes have been cast yet"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {optionsWithPercentages.map((option: any, index: number) => {
            const isLeading = index === 0 && hasVotes;
            const isSecond = index === 1 && hasVotes;
            
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.text}</span>
                    {isLeading && (
                      <Badge variant="default" className="text-xs">
                        Leading
                      </Badge>
                    )}
                    {isSecond && (
                      <Badge variant="secondary" className="text-xs">
                        2nd Place
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{option.votes} votes</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({option.percentage}%)
                    </span>
                  </div>
                </div>
                <Progress 
                  value={option.percentage} 
                  className="h-2"
                  style={{
                    '--progress-background': isLeading 
                      ? 'hsl(var(--primary))' 
                      : isSecond 
                      ? 'hsl(var(--secondary))' 
                      : 'hsl(var(--muted))'
                  } as React.CSSProperties}
                />
                {poll.is_active && !hasVoted && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => handleVote(index)}
                    disabled={votingIndex !== null}
                  >
                    {votingIndex === index ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Voting...
                      </>
                    ) : (
                      `Vote for ${option.text}`
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Additional Analytics */}
      {hasVotes && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Participation Rate</p>
                <p className="text-muted-foreground">
                  {totalVotes} {totalVotes === 1 ? 'person has' : 'people have'} voted
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Vote Distribution</p>
                <p className="text-muted-foreground">
                  {optionsWithPercentages.filter(o => o.votes > 0).length} of {displayOptions.options.length} options received votes
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Winning Margin</p>
                <p className="text-muted-foreground">
                  {optionsWithPercentages.length > 1 
                    ? `${optionsWithPercentages[0].percentage - optionsWithPercentages[1].percentage}% ahead`
                    : 'No competition yet'
                  }
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Poll Status</p>
                <p className="text-muted-foreground">
                  {poll.is_active ? 'Currently accepting votes' : 'Voting has ended'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Votes State */}
      {!hasVotes && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No votes yet</h3>
            <p className="text-muted-foreground">
              Be the first to vote and see the results!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PollResults;