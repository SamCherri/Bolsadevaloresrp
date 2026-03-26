'use client';

import { runExchangeExpirationAction } from '@/actions/exchange-actions';
import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormStateMessage } from './form-state-message';
import { FormSubmitButton } from './form-submit-button';

export function ExpireExchangeForm() {
  const [state, formAction] = useActionState(runExchangeExpirationAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-2">
      <FormStateMessage state={state} />
      <FormSubmitButton label="Executar expiração agora" pendingLabel="Executando..." />
    </form>
  );
}
