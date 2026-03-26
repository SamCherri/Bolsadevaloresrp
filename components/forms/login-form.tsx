'use client';

import { useActionState } from 'react';
import { loginAction } from '@/actions/auth-actions';
import { FormSubmitButton } from './form-submit-button';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormStateMessage } from './form-state-message';

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="card max-w-md w-full space-y-4">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <input className="input" name="identifier" placeholder="Email ou username" required />
      <input className="input" type="password" name="password" placeholder="Senha" required />
      <FormStateMessage state={state} />
      <FormSubmitButton label="Login" pendingLabel="Entrando..." />
    </form>
  );
}
