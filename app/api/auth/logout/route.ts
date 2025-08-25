import { NextRequest, NextResponse } from 'next/server';
import { AuthServer } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    // Extract token from request
    const token = AuthServer.extractTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        createErrorResponse('No token provided'),
        { status: 401 }
      );
    }

    // Verify token
    const user = await AuthServer.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Invalid token'),
        { status: 401 }
      );
    }

    // TODO: Add token to blacklist or invalidate in database
    // For now, we'll just return success since client will remove token
    console.log(`User ${user.id} logged out`);

    return NextResponse.json(
      createSuccessResponse(null, 'Logout successful')
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}