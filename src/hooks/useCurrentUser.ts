import { useSession } from 'next-auth/react';

interface UseCurrentUserReturn {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  loading: boolean;
  authenticated: boolean;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user || null,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
  };
}