'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Users, Clock } from 'lucide-react';
import { useOptionalAuth } from '@/contexts/auth-context';
import { getPollById, submitVoteAction } from '@/lib/actions/poll-actions';
import { redirect } from 'next/navigation';

// Mock poll data - will be replaced with real data fetching
const mockPoll = {
  id: '1',
  question: 'What is your favorite programming language?',
  description: 'Help us understand the community preferences for programming languages in 2024.',
  options: [
    { id: 'option1', text: 'JavaScript', votes: 45 },
    { id: 'option2', text: 'Python', votes: 38 },
    { id: 'option3', text: 'TypeScript', votes: 32 },
    { id: 'option4', text: 'Go', votes: 15 },
    { id: 'option5', text: 'Rust', votes: 12 }
  ],
  totalVotes: 142,
  createdAt: '2024-01-15',
  createdBy: 'John Doe',
  isActive: true
};

interface PollDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  // Fetch poll data
  const pollResult = await getPollById(params.id);
  
  if (!pollResult.success || !pollResult.data) {
    redirect('/polls');
  }
  
  const poll = pollResult.data;
  
  return <PollDetailClient poll={poll} />;
}

function PollDetailClient({ poll }: { poll: any }) {
  const { user } = useOptionalAuth();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('pollId', poll.id);
      formData.append('optionIndex', selectedOption);
      
      const result = await submitVoteAction(formData);
      
      if (result.success) {
        setHasVoted(true);
      } else {
        setError(result.error || 'Failed to submit vote');
      }
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/polls" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Polls
            </Link>
          </Button>
        </div>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Thank You!</CardTitle>
            <CardDescription>
              Your vote has been recorded successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You voted for: <strong>{poll.options[parseInt(selectedOption)]}</strong>
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href="/polls">Browse More Polls</Link>
              </Button>
              <Button variant="outline" onClick={() => setHasVoted(false)}>
                View Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/polls" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Polls
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          {poll.description && (
            <CardDescription className="text-base">
              {poll.description}
            </CardDescription>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {poll.votes.reduce((a: number, b: number) => a + b, 0)} votes
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Created {new Date(poll.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleVoteSubmit} className="space-y-6">
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {poll.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                  <span className="text-sm text-gray-500">
                    {poll.votes[index]} votes
                  </span>
                </div>
              ))}
            </RadioGroup>
            
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={!selectedOption || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setHasVoted(true)}>
                View Results
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!user && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> You're voting as a guest. 
              <Link href="/auth/login" className="underline hover:no-underline">
                Sign in
              </Link> to track your votes and create your own polls.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}