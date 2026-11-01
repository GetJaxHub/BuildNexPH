import type { VerificationStatus } from '@/types';

const STATUS_STYLES: Record<VerificationStatus, { label: string; className: string }> = {
  pending: { label: 'Pending review', className: 'bg-warning-100 text-warning-700 border-warning-200' },
  approved: { label: 'Approved', className: 'bg-success-100 text-success-700 border-success-200' },
  rejected: { label: 'Rejected', className: 'bg-error-50 text-error-700 border-error-200' },
};

export default function VerificationBadge({ status }: { status: VerificationStatus }) {
  const style = STATUS_STYLES[status];
  return <span className={`badge border ${style.className}`}>{style.label}</span>;
}
