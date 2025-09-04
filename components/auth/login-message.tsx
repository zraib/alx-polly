"use client";

import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginMessage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  
  if (!message) return null;
  
  return (
    <Alert className="mb-4">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}