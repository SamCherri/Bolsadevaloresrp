import Link from 'next/link';
import { LoginForm } from '@/components/forms/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      <LoginForm />
      <p className="text-sm">Não possui conta? <Link className="text-info" href="/register">Cadastrar</Link></p>
    </div>
  );
}
