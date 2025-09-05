'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Eye,
  Vote
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface DashboardStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  recentActivity: Array<{
    id: string;
    type: 'poll_created' | 'vote_cast' | 'poll_activated' | 'poll_deactivated';
    pollTitle: string;
    timestamp: string;
  }>;
  topPolls: Array<{
    id: string;
    title: string;
    votes: number;
    isActive: boolean;
  }>;
}

interface VoteWithPoll {
  id: string;
  created_at: string;
  poll: {
    id: string;
    title: string;
  } | null;
}

export function RealtimeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPolls: 0,
    activePolls: 0,
    totalVotes: 0,
    recentActivity: [],
    topPolls: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use the imported supabase client

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch polls with vote counts
      const { data: polls, error: pollsError } = await supabase
        .from('polls')
        .select(`
          id,
          title,
          is_active,
          created_at,
          votes:votes(id)
        `);

      if (pollsError) throw pollsError;

      // Calculate stats
      const totalPolls = polls?.length || 0;
      const activePolls = polls?.filter(p => p.is_active).length || 0;
      const totalVotes = polls?.reduce((sum, poll) => sum + (poll.votes?.length || 0), 0) || 0;

      // Get top polls by vote count
      const topPolls = polls
        ?.map(poll => ({
          id: poll.id,
          title: poll.title,
          votes: poll.votes?.length || 0,
          isActive: poll.is_active
        }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5) || [];

      // Fetch recent votes for activity feed
      const { data: recentVotes, error: votesError } = await supabase
        .from('votes')
        .select(`
          id,
          created_at,
          poll:polls(id, title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (votesError) throw votesError;

      const recentActivity = recentVotes?.map(vote => ({
        id: vote.id,
        type: 'vote_cast' as const,
        pollTitle: (vote.poll as any)?.[0]?.title || 'Unknown Poll',
        timestamp: vote.created_at
      })) || [];

      setStats({
        totalPolls,
        activePolls,
        totalVotes,
        recentActivity,
        topPolls
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    // Set up real-time subscriptions
    const pollsChannel = supabase
      .channel('dashboard-polls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls'
        },
        () => {
          console.log('Poll change detected, refreshing dashboard');
          fetchDashboardStats();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    const votesChannel = supabase
      .channel('dashboard-votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes'
        },
        () => {
          console.log('Vote change detected, refreshing dashboard');
          fetchDashboardStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [supabase]);

  if (error) {
    return (
      <Alert>
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load dashboard: {error}</span>
          <Button variant="outline" size="sm" onClick={fetchDashboardStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Live Dashboard</h2>
        <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
          {isConnected ? (
            <><Wifi className="h-3 w-3" /> Live Updates</>
          ) : (
            <><WifiOff className="h-3 w-3" /> Disconnected</>
          )}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalPolls}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePolls} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.activePolls}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPolls > 0 ? Math.round((stats.activePolls / stats.totalPolls) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalVotes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPolls > 0 ? Math.round(stats.totalVotes / stats.totalPolls) : 0} avg per poll
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.activePolls > 0 ? Math.round(stats.totalVotes / stats.activePolls) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              votes per active poll
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Polls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Polls by Votes
            </CardTitle>
            <CardDescription>
              Most popular polls ranked by vote count
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : stats.topPolls.length > 0 ? (
              stats.topPolls.map((poll, index) => (
                <div key={poll.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <Link 
                        href={`/polls/${poll.id}`} 
                        className="font-medium hover:underline"
                      >
                        {poll.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={poll.isActive ? "default" : "secondary"} className="text-xs">
                          {poll.isActive ? "Active" : "Closed"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{poll.votes}</div>
                    <div className="text-xs text-muted-foreground">votes</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">No polls yet</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Live feed of voting activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="flex-1">
                    <span className="font-medium">New vote</span> on{' '}
                    <span className="text-muted-foreground">{activity.pollTitle}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">No recent activity</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RealtimeDashboard;