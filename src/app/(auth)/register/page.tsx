import { AuthCard } from '@/components/auth/AuthCard';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ROUTES } from '@/config/routes';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Sign up to get started with Trello Clone"
      footer={<div>Have already an account? <Link className='text-muted-foreground' href={ROUTES.login}>Login</Link></div>}
    >
      <RegisterForm />
    </AuthCard>
  );
}