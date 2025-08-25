import { CreatePollForm } from '@/components/polls/create-poll-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreatePollPage() {
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

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create New Poll</h1>
        <p className="text-muted-foreground">
          Ask a question and let people vote on the options you provide
        </p>
      </div>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tips for Creating Great Polls</CardTitle>
          <CardDescription>
            Follow these guidelines to create engaging polls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Keep your question clear and concise</li>
            <li>• Provide balanced and comprehensive options</li>
            <li>• Avoid leading or biased language</li>
            <li>• Consider adding a description for context</li>
          </ul>
        </CardContent>
      </Card>

      {/* Create Poll Form */}
      <CreatePollForm />
    </div>
  );
}