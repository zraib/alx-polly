"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllActivePolls } from "@/lib/actions/poll-actions";

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

export function PollList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const result = await getAllActivePolls();
        if (result.success) {
          setPolls(result.polls);
        } else {
          console.error('Failed to fetch polls:', result.error);
        }
      } catch (error) {
        console.error('Failed to fetch polls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, []);

  const handleVote = (pollId: string, optionIndex: number) => {
    // TODO: Implement voting logic
    console.log(`Voting for poll ${pollId}, option ${optionIndex}`);
    
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const newVotes = [...poll.votes];
        newVotes[optionIndex] += 1;
        return { ...poll, votes: newVotes };
      }
      return poll;
    }));
  };

  const getTotalVotes = (votes: number[]) => {
    return votes.reduce((sum, count) => sum + count, 0);
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Polls</h2>
        <Button>Create New Poll</Button>
      </div>
      
      {polls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No polls available. Create your first poll!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = getTotalVotes(poll.votes);
            
            return (
              <Card key={poll.id}>
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  <CardDescription>
                    {poll.description} • Created by {poll.created_by} • {totalVotes} votes
                  </CardDescription>
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
                            <span className="text-sm text-gray-500">
                              {votes} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(poll.id, index)}
                            className="w-full"
                          >
                            Vote for {option}
                          </Button>
                        </div>
                      );
                    })}
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