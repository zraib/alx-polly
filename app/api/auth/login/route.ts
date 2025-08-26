import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { AuthServer } from '@/lib/auth-server';
import { type LoginCredentials } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse('Email and password are required'),
        { status: 400 }
      );
    }

    // Find user by email
    const user = await database.users.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials'),
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await AuthServer.comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials'),
        { status: 401 }
      );
    }

    // Generate tokens
    const tokens = AuthServer.generateTokens(user);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      createSuccessResponse(
        {
          user: userWithoutPassword,
          tokens
        },
        'Login successful'
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}