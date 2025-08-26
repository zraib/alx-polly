import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { AuthServer } from '@/lib/auth-server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';
import type { UpdatePollData } from '@/types';

// GET /api/polls/[id] - Get a specific poll
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const poll = await database.polls.findById(id);
    if (!poll) {
      return NextResponse.json(
        createErrorResponse('Poll not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(poll, 'Poll retrieved successfully')
    );
  } catch (error) {
    console.error('Get poll error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// PUT /api/polls/[id] - Update a specific poll
export async function PUT(
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

    const { id } = params;
    const body: UpdatePollData = await request.json();

    // Find the poll
    const poll = await database.polls.findById(id);
    if (!poll) {
      return NextResponse.json(
        createErrorResponse('Poll not found'),
        { status: 404 }
      );
    }

    // Check if user owns the poll
    if (poll.createdBy !== user.id) {
      return NextResponse.json(
        createErrorResponse('You can only update your own polls'),
        { status: 403 }
      );
    }

    // Update the poll
    const updatedPoll = await database.polls.update(id, body);

    return NextResponse.json(
      createSuccessResponse(updatedPoll, 'Poll updated successfully')
    );
  } catch (error) {
    console.error('Update poll error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// DELETE /api/polls/[id] - Delete a specific poll
export async function DELETE(
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

    const { id } = params;

    // Find the poll
    const poll = await database.polls.findById(id);
    if (!poll) {
      return NextResponse.json(
        createErrorResponse('Poll not found'),
        { status: 404 }
      );
    }

    // Check if user owns the poll
    if (poll.createdBy !== user.id) {
      return NextResponse.json(
        createErrorResponse('You can only delete your own polls'),
        { status: 403 }
      );
    }

    // Delete the poll
    await database.polls.delete(id);

    return NextResponse.json(
      createSuccessResponse(null, 'Poll deleted successfully')
    );
  } catch (error) {
    console.error('Delete poll error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}