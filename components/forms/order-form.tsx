'use client';

import { createOrderAction } from '@/actions/order-actions';
import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormSubmitButton } from './form-submit-button';
import { FormStateMessage } from './form-state-message';

export function OrderForm({ assetId, type }: { assetId: string; type: 'BUY' | 'SELL' }) {
  const [state, formAction] = useActionState(createOrderAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="card space-y-3">
      <h3 className="font-semibold">{type === 'BUY' ? 'Comprar ação (automático)' : 'Vender ação (automático)'}</h3>
      <input type="hidden" name="assetId" value={assetId} />
      <input type="hidden" name="type" value={type} />
      <label className="text-sm">Quantidade</label>
      <input className="input" type="number" min={1} name="quantity" required />
      <FormStateMessage state={state} />
      <FormSubmitButton label="Executar ordem" pendingLabel="Executando..." />
    </form>
  );
}
