"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PollListSkeleton } from "./poll-skeleton";

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

interface PollListProps {
  initialPolls?: Poll[];
  initialPagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function PollList({ initialPolls, initialPagination }: PollListProps) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls || []);
  const [page, setPage] = useState(initialPagination?.currentPage || 1);
  const [totalPages, setTotalPages] = useState(initialPagination?.totalPages || 1);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Polls</h2>
        <Button>Create New Poll</Button>
      </div>
      
      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No active polls found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = getTotalVotes(poll.votes);
            
            return (
              <Card key={poll.id} className="w-full">
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  <CardDescription>
                    {poll.description} • Created by {poll.created_by} • {totalVotes} votes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {poll.options.map((option, index) => {
                      const votes = poll.votes[index] || 0;
                      const percentage = getVotePercentage(votes, totalVotes);
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{option}</span>
                            <span className="text-sm text-muted-foreground">
                              {votes} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}