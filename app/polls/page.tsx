'use client';

import { PollList } from '@/components/polls/poll-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useOptionalAuth } from '@/contexts/auth-context';

export default function PollsPage() {
  const { user, loading } = useOptionalAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
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
        <PollList />
      </div>
    </div>
  );
}