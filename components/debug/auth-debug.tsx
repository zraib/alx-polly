"use client";

import { useAuth } from "@/contexts/auth-context";

export function AuthDebug() {
  const { user, loading } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-sm max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug Info:</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User exists: {user ? 'true' : 'false'}</div>
        {user && (
          <>
            <div>ID: {user.id}</div>
            <div>Email: {user.email}</div>
            <div>Name: {user.name || 'No name'}</div>
          </>
        )}
        {!user && !loading && (
          <div className="text-red-300">No user data available</div>
        )}
      </div>
    </div>
  );
}