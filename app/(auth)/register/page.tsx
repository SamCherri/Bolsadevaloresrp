import Link from 'next/link';
import { RegisterForm } from '@/components/forms/register-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      <RegisterForm />
      <p className="text-sm">Já possui conta? <Link className="text-info" href="/login">Entrar</Link></p>
    </div>
  );
}
