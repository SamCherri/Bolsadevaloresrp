import clsx from 'clsx';

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  return (
    <span
      className={clsx('badge', {
        'bg-success/20 text-success': ['APPROVED', 'ACTIVE', 'EXECUTED'].some((k) => normalized.includes(k)),
        'bg-warning/20 text-warning': normalized.includes('PENDING'),
        'bg-danger/20 text-danger': normalized.includes('REJECTED') || normalized.includes('EXPIRED'),
        'bg-slate-700 text-slate-200': normalized.includes('FROZEN') || normalized.includes('DRAFT') || normalized.includes('CANCELLED'),
      })}
    >
      {normalized}
    </span>
  );
}
