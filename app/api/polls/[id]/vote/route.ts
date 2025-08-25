import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { AuthServer } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';

// POST /api/polls/[id]/vote - Vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract and verify token
    const token = AuthServer.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        createErrorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const user = await AuthServer.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Invalid token'),
        { status: 401 }
      );
    }

    const { id: pollId } = params;
    const body = await request.json();
    const { optionIndex } = body;

    // Validate input
    if (typeof optionIndex !== 'number' || optionIndex < 0) {
      return NextResponse.json(
        createErrorResponse('Valid option index is required'),
        { status: 400 }
      );
    }

    // Find the poll
    const poll = await database.polls.findById(pollId);
    if (!poll) {
      return NextResponse.json(
        createErrorResponse('Poll not found'),
        { status: 404 }
      );
    }

    // Check if poll is active
    if (!poll.isActive) {
      return NextResponse.json(
        createErrorResponse('This poll is no longer active'),
        { status: 400 }
      );
    }

    // Check if poll has expired
    if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
      return NextResponse.json(
        createErrorResponse('This poll has expired'),
        { status: 400 }
      );
    }

    // Validate option index
    if (optionIndex >= poll.options.length) {
      return NextResponse.json(
        createErrorResponse('Invalid option index'),
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVote = await database.votes.findByUserAndPoll(user.id, pollId);
    if (existingVote && !poll.allowMultipleVotes) {
      return NextResponse.json(
        createErrorResponse('You have already voted on this poll'),
        { status: 400 }
      );
    }

    // Create the vote
    const voteData = {
      userId: user.id,
      pollId,
      optionIndex
    };

    const vote = await database.votes.create(voteData);

    // Get updated poll with new vote counts
    const updatedPoll = await database.polls.findById(pollId);

    return NextResponse.json(
      createSuccessResponse(
        {
          vote,
          poll: updatedPoll
        },
        'Vote recorded successfully'
      )
    );
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// GET /api/polls/[id]/vote - Get user's vote for a poll
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract and verify token
    const token = AuthServer.extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        createErrorResponse('Authentication required'),
        { status: 401 }
      );
    }

    const user = await AuthServer.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Invalid token'),
        { status: 401 }
      );
    }

    const { id: pollId } = params;

    // Find user's vote for this poll
    const vote = await database.votes.findByUserAndPoll(user.id, pollId);

    return NextResponse.json(
      createSuccessResponse(vote, vote ? 'Vote found' : 'No vote found')
    );
  } catch (error) {
    console.error('Get vote error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}