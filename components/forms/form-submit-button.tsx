'use client';

import { useFormStatus } from 'react-dom';

export function FormSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="btn-primary w-full" type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
