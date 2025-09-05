import { PollList } from '@/components/polls/poll-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PollListSkeleton } from '@/components/polls/poll-skeleton';
import Link from 'next/link';
import { getAllActivePolls } from '@/lib/actions/poll-actions';
import { Suspense } from 'react';

async function PollsContent() {
  const result = await getAllActivePolls(0, 6);
  
  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive mb-4">{result.error || 'Failed to fetch polls'}</p>
          <Button asChild variant="outline">
            <Link href="/polls">Try Again</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return <PollList initialPolls={result.polls || []} initialPagination={result.pagination} />;
}

export default function PollsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browse Polls</h1>
          <p className="text-muted-foreground">
            Discover and participate in polls from the community
          </p>
        </div>
        <Button asChild>
          <Link href="/polls/create">
            Create New Poll
          </Link>
        </Button>
      </div>

      {/* Filter/Search Section - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Polls</CardTitle>
          <CardDescription>
            Search and filter functionality will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon: Search by title, filter by category, sort by date or popularity
          </p>
        </CardContent>
      </Card>

      {/* Polls List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Polls</h2>
        <Suspense fallback={<PollListSkeleton count={6} />}>
          <PollsContent />
        </Suspense>
      </div>
    </div>
  );
}