import { AuthClient } from './auth';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP client configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

// Base API client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requiresAuth = false
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = AuthClient.getAccessToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || 'Request failed',
          response.status,
          data.code
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0);
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, requiresAuth = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    requiresAuth = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requiresAuth });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    requiresAuth = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, requiresAuth });
  }

  async delete<T>(
    endpoint: string,
    requiresAuth = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    requiresAuth = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requiresAuth });
  }
}

// Create API client instance
export const api = new ApiClient();

// Specific API endpoints
export const pollsAPI = {
  // Get all active polls
  getPolls: () => api.get('/polls'),
  
  // Get poll by ID
  getPoll: (id: string) => api.get(`/polls/${id}`),
  
  // Create new poll
  createPoll: (pollData: any) => api.post('/polls', pollData, true),
  
  // Update poll
  updatePoll: (id: string, updates: any) => api.put(`/polls/${id}`, updates, true),
  
  // Delete poll
  deletePoll: (id: string) => api.delete(`/polls/${id}`, true),
  
  // Vote on poll
  vote: (pollId: string, optionIndex: number) => 
    api.post(`/polls/${pollId}/vote`, { optionIndex }, true),
  
  // Get user's polls
  getUserPolls: () => api.get('/polls/my-polls', true),
};

export const usersAPI = {
  // Get current user profile
  getProfile: () => api.get('/users/profile', true),
  
  // Update user profile
  updateProfile: (updates: any) => api.put('/users/profile', updates, true),
  
  // Delete user account
  deleteAccount: () => api.delete('/users/profile', true),
};

// Response helpers
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (error: string, code?: string): ApiResponse => ({
  success: false,
  error
});

// Pagination helpers
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
});

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};