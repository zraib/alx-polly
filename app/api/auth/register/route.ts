import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { AuthServer, type RegisterData } from '@/lib/auth-server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        createErrorResponse('Name, email, and password are required'),
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        createErrorResponse('Invalid email format'),
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        createErrorResponse('Password must be at least 6 characters long'),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await database.users.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        createErrorResponse('User with this email already exists'),
        { status: 409 }
      );
    }

    // Create user in database (password is handled by Supabase Auth)
    const newUser = await database.users.create({
      name,
      email
    })

    // Generate tokens
    const tokens = AuthServer.generateTokens(newUser);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      createSuccessResponse(
        {
          user: userWithoutPassword,
          tokens
        },
        'Registration successful'
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}