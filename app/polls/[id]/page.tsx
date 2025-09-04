import { Poll } from '@/types';
import { getPollById } from '@/lib/actions/poll-actions';
import { redirect } from 'next/navigation';
import { PollDetailClient } from './poll-detail-client';

interface PollDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pollResult = await getPollById(id);
  
  if (!pollResult.success || !pollResult.data) {
    redirect('/polls');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PollDetailClient poll={pollResult.data} />
    </div>
  );
}