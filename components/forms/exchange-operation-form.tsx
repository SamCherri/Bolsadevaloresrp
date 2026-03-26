'use client';

import { useActionState } from 'react';
import { createExchangeOperationFormAction } from '@/actions/exchange-actions';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormStateMessage } from './form-state-message';
import { FormSubmitButton } from './form-submit-button';

export function ExchangeOperationForm({ type }: { type: 'DEPOSIT' | 'WITHDRAW' }) {
  const [state, formAction] = useActionState(createExchangeOperationFormAction, INITIAL_ACTION_STATE);
  const title = type === 'DEPOSIT' ? 'Depósito manual (jogo → plataforma)' : 'Saque manual (plataforma → jogo)';

  return (
    <form action={formAction} className="card space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <input type="hidden" name="type" value={type} />
      <input className="input" name="amountGameCurrency" type="number" step="0.01" placeholder="Valor em moeda do jogo" required />
      <input className="input" name="exchangeRate" type="number" step="0.0001" placeholder="Taxa de conversão" required />
      <FormStateMessage state={state} />
      <FormSubmitButton label={type === 'DEPOSIT' ? 'Criar depósito' : 'Criar saque'} pendingLabel="Processando..." />
    </form>
  );
}
