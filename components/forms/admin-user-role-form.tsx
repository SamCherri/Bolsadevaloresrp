'use client';

import { useActionState } from 'react';
import { updateUserRoleAction } from '@/actions/admin-actions';
import { INITIAL_ACTION_STATE } from '@/types/action-state';
import { FormSubmitButton } from './form-submit-button';
import { FormStateMessage } from './form-state-message';

export function AdminUserRoleForm({ userId, username, email, currentRole }: { userId: string; username: string; email: string; currentRole: string }) {
  const [state, formAction] = useActionState(updateUserRoleAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="border-b border-border py-2 space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="break-words">{username} ({email})</span>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <select defaultValue={currentRole} name="role" className="input sm:!w-auto">
            <option value="INVESTOR">INVESTOR</option>
            <option value="ISSUER">ISSUER</option>
            <option value="COLLABORATOR">COLLABORATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <FormSubmitButton label="Salvar" pendingLabel="Salvando..." />
        </div>
      </div>
      <FormStateMessage state={state} />
    </form>
  );
}
