import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { AuthServer } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';
import type { CreatePollData } from '@/types';

// GET /api/polls - Get all active polls
export async function GET(request: NextRequest) {
  try {
    const polls = await database.polls.findAllActive();
    
    return NextResponse.json(
      createSuccessResponse(polls, 'Polls retrieved successfully')
    );
  } catch (error) {
    console.error('Get polls error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// POST /api/polls - Create a new poll
export async function POST(request: NextRequest) {
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

    const body: CreatePollData = await request.json();
    const { title, description, options, allowMultipleVotes, expiresAt } = body;

    // Validate input
    if (!title || !description || !options || options.length < 2) {
      return NextResponse.json(
        createErrorResponse('Title, description, and at least 2 options are required'),
        { status: 400 }
      );
    }

    if (options.length > 6) {
      return NextResponse.json(
        createErrorResponse('Maximum 6 options allowed'),
        { status: 400 }
      );
    }

    // Create poll data
    const pollData = {
      title,
      description,
      options,
      createdBy: user.id,
      createdByName: user.name,
      allowMultipleVotes: allowMultipleVotes || false,
      expiresAt: expiresAt || null
    };

    const newPoll = await database.polls.create(pollData);

    return NextResponse.json(
      createSuccessResponse(newPoll, 'Poll created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create poll error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}