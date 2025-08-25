import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PollList } from "@/components/polls/poll-list";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Polly</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create engaging polls, gather opinions, and make data-driven decisions with our easy-to-use polling platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/polls/create">Create Poll</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/polls">Browse Polls</Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Easy to Create</CardTitle>
            <CardDescription>
              Create polls in seconds with our intuitive interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add your question, provide options, and share with your audience instantly.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Real-time Results</CardTitle>
            <CardDescription>
              Watch votes come in as they happen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See live updates and detailed analytics for all your polls.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Secure & Private</CardTitle>
            <CardDescription>
              Your data is protected and secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              User authentication ensures fair voting and data integrity.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Polls Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Polls</h2>
          <Button variant="outline" asChild>
            <Link href="/polls">View All</Link>
          </Button>
        </div>
        <PollList />
      </div>
    </div>
  );
}
