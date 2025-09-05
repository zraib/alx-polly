// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  website?: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Poll types
export interface Poll {
  id: string;
  title: string;
  description: string;
  options: string[];
  votes: number[];
  created_by: string;
  created_by_name?: string;
  is_active: boolean;
  allow_multiple_selections: boolean;
  require_login: boolean;
  expiration_date?: string;
  created_at: string;
  updated_at: string;
  totalVotes?: number;
}

// Legacy interface for backward compatibility
export interface PollSettings {
  allowMultipleSelections: boolean;
  requireLogin: boolean;
  expirationDate?: Date;
}

// Computed poll option interface for display purposes
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

// Helper function to convert database poll to display format
export function transformPollForDisplay(dbPoll: any): Poll & { options: PollOption[] } {
  const totalVotes = dbPoll.votes?.reduce((sum: number, count: number) => sum + count, 0) || 0;
  
  return {
    ...dbPoll,
    options: dbPoll.options?.map((text: string, index: number) => ({
      id: index.toString(),
      text,
      votes: dbPoll.votes?.[index] || 0,
      percentage: totalVotes > 0 ? ((dbPoll.votes?.[index] || 0) / totalVotes) * 100 : 0
    })) || [],
    totalVotes
  };
}

export interface CreatePollData {
  title: string;
  description: string;
  options: string[];
  allowMultipleVotes?: boolean;
  expiresAt?: string;
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  isActive?: boolean;
  expiresAt?: string;
}

// Vote types
export interface Vote {
  id: string;
  userId: string;
  pollId: string;
  optionId: string;
  createdAt: string;
}

export interface VoteData {
  pollId: string;
  optionId: string;
}

export interface VoteResult {
  pollId: string;
  optionId: string;
  totalVotes: number;
  userVote?: Vote;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Component props types
export interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionId: string) => void;
  showVoteButton?: boolean;
  showResults?: boolean;
  className?: string;
}

export interface AuthFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export interface NavigationProps {
  user?: User | null;
  onLogout?: () => void;
  className?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface FormErrors {
  [key: string]: string;
}

// Filter and sort types
export interface PollFilters {
  search?: string;
  createdBy?: string;
  isActive?: boolean;
  hasVoted?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalVotes' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Dashboard types
export interface DashboardStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  totalViews: number;
}

export interface PollAnalytics {
  pollId: string;
  views: number;
  votes: number;
  engagement: number;
  demographics?: {
    ageGroups: { [key: string]: number };
    locations: { [key: string]: number };
  };
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'poll_created' | 'poll_voted' | 'poll_expired' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

// Settings types
export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  publicProfile: boolean;
  showVotingHistory: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;