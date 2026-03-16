import { STATUS_OPTIONS, SEVERITY_OPTIONS } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  if (!opt) return <span className="badge bg-gray-100 text-gray-700">{status}</span>;
  return (
    <span className={`badge ${opt.bg} ${opt.color}`}>
      {opt.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const opt = SEVERITY_OPTIONS.find((s) => s.value === severity);
  if (!opt) return <span className="badge bg-gray-100 text-gray-700">{severity}</span>;
  return (
    <span className={`badge ${opt.bg} ${opt.color}`}>
      {opt.label}
    </span>
  );
}
