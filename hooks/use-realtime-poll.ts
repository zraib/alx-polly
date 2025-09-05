'use client';

import { useEffect, useState, useCallback } from 'react';
import { Poll } from '@/types';
import { supabase } from '@/lib/supabase';

interface UseRealtimePollOptions {
  pollId: string;
  initialPoll: Poll;
  onUpdate?: (poll: Poll) => void;
  onError?: (error: Error) => void;
}

interface UseRealtimePollReturn {
  poll: Poll;
  isConnected: boolean;
  connectionError: string | null;
  refetch: () => Promise<void>;
}

export function useRealtimePoll({
  pollId,
  initialPoll,
  onUpdate,
  onError
}: UseRealtimePollOptions): UseRealtimePollReturn {
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Use the imported supabase client

  const fetchUpdatedPoll = useCallback(async () => {
    try {
      const { data: updatedPoll, error } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*),
          votes:votes(id, option_id)
        `)
        .eq('id', pollId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (updatedPoll) {
        // Transform the data to match our Poll type
        const optionsWithVotes = updatedPoll.options?.map((option: any) => {
          const voteCount = updatedPoll.votes?.filter((vote: any) => vote.option_id === option.id).length || 0;
          return voteCount;
        }) || [];
        
        const transformedPoll: Poll = {
          ...updatedPoll,
          totalVotes: updatedPoll.votes?.length || 0,
          options: updatedPoll.options?.map((option: any) => option.text || option.option_text) || [],
          votes: optionsWithVotes
        };
        
        setPoll(transformedPoll);
        onUpdate?.(transformedPoll);
        setConnectionError(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch poll data';
      console.error('Error fetching updated poll:', error);
      setConnectionError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [pollId, supabase, onUpdate, onError]);

  useEffect(() => {
    let votesChannel: any;
    let pollChannel: any;

    const setupSubscriptions = async () => {
      try {
        // Subscribe to vote changes (INSERT, UPDATE, DELETE)
        votesChannel = supabase
          .channel(`poll-votes-${pollId}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events
              schema: 'public',
              table: 'votes',
              filter: `poll_id=eq.${pollId}`,
            },
            (payload) => {
              console.log('Vote change detected:', payload.eventType, payload);
              fetchUpdatedPoll();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to vote changes for poll:', pollId);
              setIsConnected(true);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to subscribe to vote changes');
              setIsConnected(false);
              setConnectionError('Failed to connect to real-time updates');
            }
          });

        // Subscribe to poll status changes
        pollChannel = supabase
          .channel(`poll-status-${pollId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'polls',
              filter: `id=eq.${pollId}`,
            },
            (payload) => {
              console.log('Poll status change detected:', payload);
              fetchUpdatedPoll();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to poll status changes for poll:', pollId);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to subscribe to poll status changes');
              setConnectionError('Failed to connect to real-time updates');
            }
          });

      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setConnectionError('Failed to setup real-time connections');
        onError?.(error instanceof Error ? error : new Error('Subscription setup failed'));
      }
    };

    setupSubscriptions();

    return () => {
      if (votesChannel) {
        supabase.removeChannel(votesChannel);
      }
      if (pollChannel) {
        supabase.removeChannel(pollChannel);
      }
      setIsConnected(false);
    };
  }, [pollId, supabase, fetchUpdatedPoll, onError]);

  return {
    poll,
    isConnected,
    connectionError,
    refetch: fetchUpdatedPoll
  };
}

export default useRealtimePoll;