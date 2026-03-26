'use client';

import { useActionState } from 'react';
import { registerAction } from '@/actions/auth-actions';
import { FormSubmitButton } from './form-submit-button';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormStateMessage } from './form-state-message';

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="card max-w-md w-full space-y-4">
      <h1 className="text-2xl font-semibold">Criar conta</h1>
      <input className="input" name="name" placeholder="Nome" required />
      <input className="input" name="username" placeholder="Username" required />
      <input className="input" type="email" name="email" placeholder="Email" required />
      <input className="input" type="password" name="password" placeholder="Senha" required />
      <p className="text-xs text-slate-400">Senha mínima: 10 caracteres com maiúscula, minúscula, número e símbolo.</p>
      <FormStateMessage state={state} />
      <FormSubmitButton label="Cadastrar" pendingLabel="Cadastrando..." />
    </form>
  );
}
