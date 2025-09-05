import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import RealtimeDashboard from '@/components/dashboard/realtime-dashboard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard - Polling App',
  description: 'Real-time dashboard showing live polling statistics and activity',
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time overview of your polling activity
          </p>
        </div>
        <Button asChild>
          <Link href="/polls/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Link>
        </Button>
      </div>
      
      <RealtimeDashboard />
    </div>
  );
}