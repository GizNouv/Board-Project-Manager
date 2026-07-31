import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';
import { ROUTES } from '@/config/routes';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your account to continue"
      footer={<div>If you have no account: <Link className='text-muted-foreground' href={ROUTES.register}>Create Account</Link></div>}
    >
      <LoginForm />
    </AuthCard>
  );
}