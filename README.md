# ALX Polly 🗳️

A modern, secure, and feature-rich polling application built with Next.js 15, TypeScript, Supabase, and Shadcn UI. Create, manage, and participate in polls with advanced security features, real-time capabilities, and QR code sharing.

## ✨ Key Features

### 🔐 Authentication & Security
- **Supabase Authentication**: Secure user registration and login with email confirmation
- **CSRF Protection**: Comprehensive Cross-Site Request Forgery protection with token validation
- **Rate Limiting**: Advanced rate limiting for different endpoints (auth, poll creation, voting)
- **Row Level Security (RLS)**: Database-level security policies for data protection
- **Security Audit Logging**: Comprehensive logging of security events and actions
- **Enhanced Password Security**: Secure password handling with visibility toggles

### 📊 Poll Management
- **Interactive Poll Builder**: Create polls with multiple options using an intuitive tabbed interface
- **Advanced Poll Settings**:
  - Multiple selection options
  - Login requirements for voting
  - Expiration dates with calendar picker
  - Poll activation/deactivation controls
- **QR Code Generation**: Generate and download QR codes for easy poll sharing
- **Poll Analytics**: View vote counts and poll statistics
- **Poll Ownership**: Users can only manage their own polls with proper authorization

### 🗳️ Voting System
- **Secure Voting**: Protected voting with duplicate prevention
- **Anonymous & Authenticated Voting**: Support for both logged-in and anonymous users
- **Real-time Vote Updates**: Live vote count updates with Supabase subscriptions
- **Vote Validation**: Comprehensive validation to prevent fraud
- **Expiration Handling**: Automatic poll closure based on expiration dates
- **Optimistic UI Updates**: Immediate feedback with error recovery
- **Connection Status**: Visual indicators for real-time connection status

### 🎨 User Experience
- **Modern UI Components**: Built with Shadcn UI and Radix primitives
- **Responsive Design**: Beautiful UI that works on all devices
- **Form Validation**: Robust form handling with React Hook Form and Zod
- **Loading States**: Skeleton components and loading indicators
- **Error Handling**: User-friendly error messages and fallback states
- **Toast Notifications**: Real-time feedback for user actions
- **Accessibility**: WCAG compliant components
- **Real-time Dashboard**: Live statistics and activity monitoring
- **Connection Indicators**: Visual feedback for real-time connection status

### 🛡️ Technical Excellence
- **TypeScript**: Full type safety throughout the application
- **Server Components**: Optimized performance with Next.js App Router
- **Server Actions**: Secure data mutations without API routes
- **Database Abstraction**: Clean database operations with proper error handling
- **Input Validation**: Zod schemas for all forms and API endpoints
- **Middleware Integration**: Comprehensive request processing pipeline
- **Real-time Architecture**: Supabase subscriptions with custom hooks
- **Connection Management**: Automatic reconnection and error handling

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm**, **yarn**, **pnpm**, or **bun**
- **Supabase Account** for database and authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zraib/alx-polly.git
   cd alx-polly
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up Supabase database**
   
   Run the SQL scripts in your Supabase SQL Editor:
   - Execute `enhanced-security-policies.sql` for security policies
   - Set up the database schema for users, polls, and votes tables

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript compiler check
- `npm test` - Run the test suite

## 📁 Project Structure

```
alx-polly/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (CSRF token endpoint)
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── dashboard/         # Real-time dashboard
│   │   └── page.tsx       # Live statistics and activity page
│   ├── polls/             # Poll-related pages
│   │   ├── create/        # Poll creation page
│   │   └── [id]/          # Individual poll pages with real-time updates
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home page with poll listings
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/              # Authentication components
│   │   ├── login-form.tsx # Login form with CSRF protection
│   │   └── register-form.tsx # Registration form
│   ├── dashboard/         # Dashboard components
│   │   └── realtime-dashboard.tsx # Live statistics dashboard
│   ├── polls/             # Poll-related components
│   │   ├── create-poll-form.tsx # Poll creation form
│   │   ├── poll-card.tsx  # Poll display card
│   │   ├── poll-results.tsx # Vote results with optimistic updates
│   │   ├── qr-code.tsx    # QR code generation
│   │   └── vote-form.tsx  # Voting interface
│   ├── shared/            # Shared/common components
│   │   ├── navigation.tsx # Main navigation with dashboard link
│   │   └── footer.tsx     # Footer component
│   ├── ui/                # Shadcn UI components
│   └── csrf-token.tsx     # CSRF token provider
├── hooks/                 # Custom React hooks
│   └── use-realtime-poll.ts # Real-time poll subscription hook
├── lib/                   # Utility libraries
│   ├── actions/           # Server actions
│   │   ├── auth-actions.ts # Authentication actions
│   │   ├── poll-actions.ts # Poll management actions
│   │   └── vote-actions.ts # Voting actions
│   ├── utils/             # Utility functions
│   │   └── pagination.ts  # Pagination helpers
│   ├── auth.ts            # Authentication utilities
│   ├── database.ts        # Database abstraction layer
│   ├── supabase.ts        # Supabase client configuration
│   ├── csrf-protection.ts # CSRF protection utilities
│   ├── rate-limiter.ts    # Rate limiting implementation
│   ├── validations.ts     # Zod validation schemas
│   └── utils.ts           # General utilities
├── types/                 # TypeScript type definitions
│   └── index.ts           # Main type definitions
├── middleware.ts          # Next.js middleware for auth & security
├── enhanced-security-policies.sql # Supabase RLS policies
└── public/                # Static assets
```

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience

### Database & Authentication
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)** - Database-level security policies
- **Real-time Subscriptions** - Live data updates

### UI & Styling
- **[Shadcn UI](https://ui.shadcn.com/)** - Modern component library
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### Forms & Validation
- **[React Hook Form](https://react-hook-form.com/)** - Performant form handling
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Form validation integration

### Security & Performance
- **CSRF Protection** - Cross-Site Request Forgery prevention
- **Rate Limiting** - Request throttling and abuse prevention
- **Input Sanitization** - XSS protection and data validation
- **Server Actions** - Secure server-side mutations

### Additional Features
- **[QRCode.react](https://github.com/zpao/qrcode.react)** - QR code generation
- **[date-fns](https://date-fns.org/)** - Date utility library
- **[react-day-picker](https://react-day-picker.js.org/)** - Date picker component

## 🎯 Usage Guide

### Creating an Account

1. Navigate to `/auth/register`
2. Fill in your email and password (minimum 6 characters)
3. Confirm your password
4. Check your email for confirmation link
5. Click the confirmation link to activate your account

### Creating a Poll

1. Sign in to your account
2. Navigate to `/polls/create`
3. Fill in the **Basic Info** tab:
   - Poll title (required)
   - Description (optional)
   - Add 2-10 poll options
4. Configure **Settings** (optional):
   - Enable multiple selections
   - Require login to vote
   - Set expiration date
5. Click "Create Poll" to publish
6. Share the poll URL or QR code

### Voting on Polls

1. Access a poll via shared link or QR code
2. Select your preferred option(s)
3. Submit your vote
4. View real-time results (if enabled)

### Managing Your Polls

1. View all your polls on the dashboard
2. Toggle poll active/inactive status
3. View detailed analytics and vote counts
4. Generate and download QR codes
5. Share poll links with others

### Real-time Dashboard

1. Navigate to `/dashboard` to view live statistics
2. Monitor total polls, active polls, and vote counts in real-time
3. View top polls ranked by vote count
4. Track recent voting activity as it happens
5. Check connection status with live/offline indicators
6. Automatic data refresh when polls or votes change

## 🔧 Development

### Adding New Components

To add new Shadcn UI components:

```bash
npx shadcn@latest add [component-name]
```

### Code Style Guidelines

- Use TypeScript for all new files
- Follow the existing component structure
- Use Tailwind CSS for styling
- Implement proper error handling with try-catch blocks
- Add appropriate TypeScript types and interfaces
- Use Server Actions for data mutations
- Validate all inputs with Zod schemas
- Include CSRF protection for forms

### Security Best Practices

- Never expose sensitive environment variables to the client
- Always validate user inputs on both client and server
- Use parameterized queries to prevent SQL injection
- Implement proper authentication checks
- Apply rate limiting to prevent abuse
- Use HTTPS in production
- Regularly update dependencies

## 🧪 Testing

The application includes comprehensive testing setup:

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Server action and API endpoint testing
- **Security Tests**: CSRF protection and rate limiting validation
- **Type Checking**: TypeScript compilation verification

Run tests with:
```bash
npm test
npx tsc --noEmit  # Type checking
```

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy ALX Polly:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy with zero configuration

### Other Platforms

ALX Polly can be deployed on any platform supporting Next.js:

- **Netlify**
- **Railway**
- **DigitalOcean App Platform**
- **AWS Amplify**
- **Heroku**

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_production_url
```

## 🔄 Recent Improvements

### Real-time Features
- ✅ Implemented Supabase real-time subscriptions for live vote updates
- ✅ Created real-time dashboard with live statistics and activity feed
- ✅ Added connection status indicators with visual feedback
- ✅ Built reusable `useRealtimePoll` hook for subscription management
- ✅ Implemented optimistic UI updates with error recovery
- ✅ Added automatic reconnection and error handling

### Security Enhancements
- ✅ Implemented comprehensive CSRF protection
- ✅ Added advanced rate limiting for all endpoints
- ✅ Enhanced Row Level Security (RLS) policies
- ✅ Added security audit logging
- ✅ Fixed TypeScript compilation errors
- ✅ Resolved React testing warnings

### Performance Optimizations
- ✅ Optimized database queries with proper indexing
- ✅ Implemented pagination for poll listings
- ✅ Added loading states and skeleton components
- ✅ Enhanced error handling throughout the application
- ✅ Improved real-time subscription cleanup and memory management

### Code Quality Improvements
- ✅ Added comprehensive input validation with Zod
- ✅ Implemented proper error boundaries
- ✅ Enhanced TypeScript type safety
- ✅ Added comprehensive testing coverage (71 tests passing)
- ✅ Improved code organization and structure
- ✅ Created modular real-time architecture with custom hooks

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Polls Table
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options TEXT[] NOT NULL,
  votes INTEGER[] DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  allow_multiple_selections BOOLEAN DEFAULT false,
  require_login BOOLEAN DEFAULT false,
  expiration_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Votes Table
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure TypeScript compilation passes
- Test security features thoroughly

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

If you have any questions or need help:

- Open an issue on GitHub
- Check the documentation
- Review the code examples
- Contact the development team

## 🙏 Acknowledgments

- **Supabase** for providing an excellent backend-as-a-service
- **Vercel** for seamless deployment and hosting
- **Shadcn** for the beautiful UI component library
- **Next.js team** for the amazing React framework
- **Open source community** for the incredible tools and libraries

---

**Built with ❤️ using modern web technologies for a secure and delightful polling experience.**
