'use client';

import { useActionState } from 'react';
import { processExchangeOperationFormAction } from '@/actions/exchange-actions';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormStateMessage } from './form-state-message';
import { FormSubmitButton } from './form-submit-button';

export function CollaboratorOperationForm({ operationId, approve }: { operationId: string; approve: boolean }) {
  const [state, formAction] = useActionState(processExchangeOperationFormAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="operationId" value={operationId} />
      <input type="hidden" name="approve" value={String(approve)} />
      <input className="input" name="notes" placeholder="Observação (opcional)" />
      <FormStateMessage state={state} />
      <FormSubmitButton label={approve ? 'Aprovar' : 'Rejeitar'} pendingLabel="Processando..." />
    </form>
  );
}
