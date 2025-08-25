# ALX Polly 🗳️

A modern, feature-rich polling application built with Next.js 15, TypeScript, and Shadcn UI. Create, manage, and participate in polls with advanced settings and real-time notifications.

## ✨ Features

### Poll Creation & Management
- **Interactive Poll Builder**: Create polls with multiple options using an intuitive tabbed interface
- **Advanced Settings**: Configure polls with:
  - Multiple selection options
  - Login requirements for voting
  - Expiration dates with calendar picker
- **Real-time Notifications**: Toast notifications for success/error feedback
- **Responsive Design**: Beautiful UI that works on all devices

### User Experience
- **Modern UI Components**: Built with Shadcn UI and Radix primitives
- **Form Validation**: Robust form handling with React Hook Form and Zod
- **Date Management**: Intuitive date picking with react-day-picker
- **Accessibility**: WCAG compliant components

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **Server Components**: Optimized performance with Next.js App Router
- **Tailwind CSS**: Utility-first styling with custom design system
- **Component Library**: Reusable UI components with consistent styling

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm**, **yarn**, **pnpm**, or **bun**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/alx-polly.git
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

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server

## 📁 Project Structure

```
alx-polly/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── polls/             # Poll-related pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── polls/             # Poll-related components
│   ├── shared/            # Shared/common components
│   └── ui/                # Shadcn UI components
├── lib/                   # Utility libraries
│   ├── api.ts             # API client and helpers
│   ├── auth.ts            # Authentication utilities
│   ├── database.ts        # Database utilities
│   └── utils.ts           # General utilities
├── types/                 # TypeScript type definitions
│   └── index.ts           # Main type definitions
└── public/                # Static assets
```

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

### UI & Styling
- **[Shadcn UI](https://ui.shadcn.com/)** - Component library
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Lucide React](https://lucide.dev/)** - Icon library

### Forms & Validation
- **[React Hook Form](https://react-hook-form.com/)** - Form handling
- **[Zod](https://zod.dev/)** - Schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Form validation integration

### Date & Time
- **[date-fns](https://date-fns.org/)** - Date utility library
- **[react-day-picker](https://react-day-picker.js.org/)** - Date picker component

### Utilities
- **[clsx](https://github.com/lukeed/clsx)** - Conditional className utility
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Tailwind class merging
- **[class-variance-authority](https://cva.style/)** - Component variants

## 🎯 Usage

### Creating a Poll

1. Navigate to `/polls/create`
2. Fill in the **Basic Info** tab:
   - Poll title
   - Description (optional)
   - Add poll options
3. Configure **Settings** (optional):
   - Enable multiple selections
   - Require login to vote
   - Set expiration date
4. Click "Create Poll" to publish

### Poll Settings Options

- **Allow Multiple Selections**: Let users select multiple options
- **Require Login to Vote**: Restrict voting to authenticated users
- **Poll Expiration Date**: Set when the poll stops accepting votes

## 🔧 Development

### Adding New Components

To add new Shadcn UI components:

```bash
npx shadcn@latest add [component-name]
```

### Code Style

- Use TypeScript for all new files
- Follow the existing component structure
- Use Tailwind CSS for styling
- Implement proper error handling
- Add appropriate TypeScript types

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy ALX Polly is using [Vercel](https://vercel.com/):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Other Platforms

ALX Polly can be deployed on any platform that supports Next.js:

- **Netlify**
- **Railway**
- **DigitalOcean App Platform**
- **AWS Amplify**

Refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for detailed instructions.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and Shadcn UI**
