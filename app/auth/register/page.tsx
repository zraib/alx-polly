import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">
            Join Polly to create and participate in polls
          </p>
        </div>
        
        <RegisterForm />
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}