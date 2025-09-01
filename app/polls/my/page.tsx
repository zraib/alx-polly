'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRequiredAuth } from '@/contexts/auth-context';
import { getUserPolls } from '@/lib/actions/poll-actions';
import Link from 'next/link';

interface Poll {
  id: string;
  title: string;
  description: string;
  options: string[];
  votes: number[];
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export default function MyPollsPage() {
  const { user, loading } = useRequiredAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserPolls = async () => {
      try {
        const result = await getUserPolls();
        if (result.success) {
          setPolls(result.polls);
        } else {
          console.error('Failed to fetch user polls:', result.error);
        }
      } catch (error) {
        console.error('Failed to fetch user polls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPolls();
  }, [user]);

  const getTotalVotes = (votes: number[]) => {
    return votes.reduce((sum, count) => sum + count, 0);
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Polls</h1>
          <p className="text-muted-foreground">
            Manage and view your created polls
          </p>
        </div>
        <Link href="/polls/create" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Create New Poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="text-6xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold">No polls yet</h3>
                <p className="text-muted-foreground">Create your first poll to get started!</p>
              </div>
              <Link href="/polls/create" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Create Your First Poll
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = getTotalVotes(poll.votes);
            const createdDate = new Date(poll.created_at).toLocaleDateString();
            
            return (
              <Card key={poll.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{poll.title}</CardTitle>
                      <CardDescription>
                        {poll.description} • Created on {createdDate} • {totalVotes} votes
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        poll.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {poll.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {poll.options.map((option, index) => {
                      const votes = poll.votes[index];
                      const percentage = getVotePercentage(votes, totalVotes);
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{option}</span>
                            <span className="text-sm text-muted-foreground">
                              {votes} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Total votes: {totalVotes}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}