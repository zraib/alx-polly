import { updateRLSPoliciesDirectSQL } from '@/lib/actions/admin-actions'
import { redirect } from 'next/navigation'

export default function AdminPage() {
  async function handleUpdatePolicies() {
    'use server'
    
    const result = await updateRLSPoliciesDirectSQL()
    
    if (result.success) {
      console.log('RLS policies updated successfully')
    } else {
      console.error('Failed to update RLS policies:', result.error)
    }
    
    redirect('/admin?updated=true')
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Database Management</h2>
        
        <form action={handleUpdatePolicies}>
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Update RLS Policies for Anonymous Voting
          </button>
        </form>
        
        <p className="text-sm text-gray-600 mt-2">
          This will update the Row Level Security policies to allow anonymous voting on polls that don't require login.
        </p>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click the button above to update RLS policies</li>
          <li>Go to <a href="/seed" className="text-blue-500 hover:underline">/seed</a> to create test polls</li>
          <li>Test voting on polls without logging in</li>
        </ol>
      </div>
    </div>
  )
}