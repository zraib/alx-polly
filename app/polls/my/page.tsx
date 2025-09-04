import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Users, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getUserPolls } from '@/lib/actions/poll-actions'
import type { Poll } from '@/types'
import { TogglePollSwitch } from '@/components/polls/toggle-poll-switch'

export default async function MyPollsPage() {
  const result = await getUserPolls()
  const polls = result.polls || []

  const getTotalVotes = (votes: number[]) => {
    return votes.reduce((sum, count) => sum + count, 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Polls</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view your created polls
          </p>
        </div>
        <Button asChild>
          <Link href="/polls/create">
            Create New Poll
          </Link>
        </Button>
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No polls yet</h3>
                <p className="text-muted-foreground">
                  Create your first poll to get started
                </p>
              </div>
              <Button asChild>
                <Link href="/polls/create">
                  Create Your First Poll
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {polls.map((poll) => (
            <Card key={poll.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{poll.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(poll.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{getTotalVotes(poll.votes)} votes</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TogglePollSwitch pollId={poll.id} isActive={poll.is_active} />
                    <Badge variant={poll.is_active ? 'default' : 'secondary'}>
                      {poll.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Options:</h4>
                    <div className="space-y-2">
                      {poll.options.map((option: string, index: number) => {
                        const voteCount = poll.votes[index] || 0
                        const totalVotes = getTotalVotes(poll.votes)
                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="font-medium">{option}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-background rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium min-w-[3rem] text-right">
                                {voteCount} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/polls/${poll.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Poll
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/polls/${poll.id}`} target="_blank">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Share
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}