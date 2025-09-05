"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Poll } from "@/types";
import { cn } from "@/lib/utils";

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionIndex: number) => void;
  showVoteButton?: boolean;
  showResults?: boolean;
  className?: string;
}

export function PollCard({ 
  poll, 
  onVote, 
  showVoteButton = true, 
  showResults = true,
  className 
}: PollCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const getTotalVotes = (votes: number[]) => {
    return votes.reduce((sum, count) => sum + count, 0);
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const handleVote = (optionIndex: number) => {
    if (onVote && !hasVoted) {
      onVote(poll.id, optionIndex);
      setHasVoted(true);
      setSelectedOption(optionIndex);
    }
  };

  const totalVotes = getTotalVotes(poll.votes);
  const formattedDate = new Date(poll.created_at).toLocaleDateString();

  return (
    <Card className={cn(`w-full ${!poll.is_active ? 'opacity-75' : ''}`, className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            <CardDescription className="mt-1">
              {poll.description}
            </CardDescription>
          </div>
          <span className={`px-2 py-1 text-xs rounded badge ${poll.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
            {poll.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>By {poll.created_by}</span>
          <span>{formattedDate}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const votes = poll.votes[index];
            const percentage = getVotePercentage(votes, totalVotes);
            const isSelected = selectedOption === index;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${isSelected ? 'text-blue-600' : ''}`}>
                    {option}
                    {isSelected && ' ✓'}
                  </span>
                  {showResults && (
                    <span className="text-sm text-gray-500">
                      {votes} votes ({percentage}%)
                    </span>
                  )}
                </div>
                
                {showResults && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isSelected ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}
                
                {showVoteButton && poll.is_active && !hasVoted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote(index)}
                    className="w-full"
                  >
                    Vote for {option}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{totalVotes === 1 ? '1 vote' : `${totalVotes} votes`}</span>
            {hasVoted && (
              <span className="text-green-600 font-medium">
                Thank you for voting!
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}