import { seedDatabase } from '@/lib/actions/seed-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'

export default function SeedPage() {
  async function handleSeed() {
    'use server'
    const result = await seedDatabase()
    if (result.success) {
      redirect('/?seeded=true')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Create sample polls to test the application functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSeed}>
            <Button type="submit" className="w-full">
              Create Sample Polls
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}