import { Award, ShieldCheck, Star } from 'lucide-react';
import type { AccreditationLevel } from '@/types';
import { accreditationStyles } from '@/lib/utils';

interface Props {
  level: AccreditationLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function AccreditationBadge({ level, size = 'md', showIcon = true }: Props) {
  const styles = accreditationStyles(level);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };

  const iconSize = {
    sm: 10,
    md: 12,
    lg: 16,
  };

  const isTopTier = level === 'AAA' || level === 'AA';

  return (
    <span
      className={`badge ${styles.bg} ${styles.text} ${styles.border} ${styles.glow} ${sizeClasses[size]} border`}
      title={styles.label}
    >
      {showIcon && level === 'AAA' && <Star size={iconSize[size]} className="fill-current" />}
      {showIcon && level === 'AA' && <Award size={iconSize[size]} className="fill-current" />}
      {showIcon && level === 'A' && <ShieldCheck size={iconSize[size]} />}
      {showIcon && isTopTier === false && level !== 'Unranked' && <ShieldCheck size={iconSize[size]} />}
      <span className="font-bold tracking-wide">{level}</span>
    </span>
  );
}
