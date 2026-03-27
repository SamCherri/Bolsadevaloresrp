import Link from 'next/link';
import { RegisterForm } from '@/components/forms/register-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">Bolsa de Valores RP</h1>
        <p className="text-sm text-slate-400 mt-1">Crie sua conta para começar</p>
      </div>
      <RegisterForm />
      <p className="text-sm">Já possui conta? <Link className="text-info" href="/login">Entrar</Link></p>
    </div>
  );
}
