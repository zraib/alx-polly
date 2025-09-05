import { PollListSkeleton } from '@/components/polls/poll-skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
        <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
      </div>
      <PollListSkeleton count={6} />
    </div>
  )
}