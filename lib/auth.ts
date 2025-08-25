import { NextRequest } from "next/server";

// Types for authentication
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Client-side auth utilities
export class AuthClient {
  private static readonly ACCESS_TOKEN_KEY = 'auth-access-token';
  private static readonly REFRESH_TOKEN_KEY = 'auth-refresh-token';
  private static readonly USER_KEY = 'auth-user';

  static setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  static clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// Server-side auth utilities
export class AuthServer {
  static extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      // TODO: Implement JWT verification
      // This is a placeholder - replace with actual JWT verification
      console.log('Verifying token:', token);
      
      // Mock verification for development
      if (token === 'mock-jwt-token') {
        return {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    // TODO: Implement proper password hashing with bcrypt
    // This is a placeholder - replace with actual bcrypt hashing
    console.log('Hashing password');
    return `hashed_${password}`;
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    // TODO: Implement proper password comparison with bcrypt
    // This is a placeholder - replace with actual bcrypt comparison
    console.log('Comparing passwords');
    return `hashed_${password}` === hashedPassword;
  }

  static generateTokens(user: User): AuthTokens {
    // TODO: Implement JWT token generation
    // This is a placeholder - replace with actual JWT generation
    console.log('Generating tokens for user:', user.id);
    
    return {
      accessToken: `access_token_${user.id}_${Date.now()}`,
      refreshToken: `refresh_token_${user.id}_${Date.now()}`
    };
  }
}

// API helper functions
export const authAPI = {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const token = AuthClient.getAccessToken();
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    AuthClient.clearAuth();
  },

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = AuthClient.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },
};