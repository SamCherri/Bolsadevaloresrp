'use client';

import { useActionState } from 'react';
import { freezeAssetFormAction, reviewAssetFormAction } from '@/actions/asset-actions';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormSubmitButton } from './form-submit-button';
import { FormStateMessage } from './form-state-message';

export function AdminAssetDecisionForm({ assetId, mode }: { assetId: string; mode: 'approve' | 'reject' | 'freeze' }) {
  const action = mode === 'freeze' ? freezeAssetFormAction : reviewAssetFormAction;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="assetId" value={assetId} />
      {mode !== 'freeze' && <input type="hidden" name="decision" value={mode} />}
      {mode !== 'freeze' && <input className="input" name="notes" placeholder="Observação (opcional)" />}
      <FormStateMessage state={state} />
      <FormSubmitButton
        label={mode === 'approve' ? 'Aprovar' : mode === 'reject' ? 'Rejeitar' : 'Congelar'}
        pendingLabel="Processando..."
      />
    </form>
  );
}
