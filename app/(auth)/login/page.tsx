import Link from 'next/link';
import { LoginForm } from '@/components/forms/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">Bolsa de Valores RP</h1>
        <p className="text-sm text-slate-400 mt-1">Acesse sua conta para continuar</p>
      </div>
      <LoginForm />
      <p className="text-sm">Não possui conta? <Link className="text-info" href="/register">Cadastrar</Link></p>
    </div>
  );
}
