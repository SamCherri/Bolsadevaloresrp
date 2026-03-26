import { ActionState } from '@/types/action-state';

export function FormStateMessage({ state }: { state: ActionState }) {
  if (state.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state.success) return <p className="text-sm text-success">{state.success}</p>;
  return null;
}
