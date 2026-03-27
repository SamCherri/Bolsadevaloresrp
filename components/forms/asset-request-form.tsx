'use client';

import { useActionState } from 'react';
import { createAssetRequestAction } from '@/actions/asset-actions';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormSubmitButton } from './form-submit-button';
import { FormStateMessage } from './form-state-message';

export function AssetRequestForm() {
  const [state, formAction] = useActionState(createAssetRequestAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="card max-w-2xl space-y-3">
      <h2 className="text-xl font-semibold">Nova solicitação de ativo</h2>
      <input className="input" name="name" placeholder="Nome" required />
      <input className="input" name="ticker" placeholder="Ticker" required />
      <textarea className="input" name="description" placeholder="Descrição" required />
      <input className="input" name="initialPrice" type="text" inputMode="decimal" placeholder="Preço inicial" required />
      <input className="input" name="quantity" type="number" placeholder="Quantidade emitida" required />
      <input className="input" name="feePercent" type="text" inputMode="decimal" placeholder="Taxa (%)" required />
      <input className="input" name="reservePercent" type="text" inputMode="decimal" placeholder="Reserva (%)" required />
      <textarea className="input" name="fundPurpose" placeholder="Finalidade do capital" required />
      <FormStateMessage state={state} />
      <FormSubmitButton label="Enviar para aprovação" pendingLabel="Enviando..." />
    </form>
  );
}
