'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { togglePollActiveAction } from '@/lib/actions/poll-actions'
import { useRouter } from 'next/navigation'

interface TogglePollSwitchProps {
  pollId: string
  isActive: boolean
}

export function TogglePollSwitch({ pollId, isActive }: TogglePollSwitchProps) {
  const [isToggling, setIsToggling] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    if (isToggling) return
    
    setIsToggling(true)
    try {
      const result = await togglePollActiveAction(pollId, !isActive)
      
      if (!result.success) {
        alert('Failed to toggle poll: ' + result.error)
      }
    } catch (error) {
      alert('Failed to toggle poll: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isToggling}
      />
      <span className={`text-sm font-medium ${
        isActive 
          ? 'text-green-700' 
          : 'text-gray-600'
      }`}>
        {isToggling ? 'Updating...' : (isActive ? 'Active' : 'Inactive')}
      </span>
    </div>
  )
}