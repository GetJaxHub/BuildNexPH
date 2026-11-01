import type { AccreditationLevel } from '@/types';

export const accreditationOrder: Record<AccreditationLevel, number> = {
  'AAA': 6,
  'AA': 5,
  'A': 4,
  'B': 3,
  'C': 2,
  'Unranked': 1,
};

export function accreditationStyles(level: AccreditationLevel): {
  bg: string;
  text: string;
  border: string;
  glow: string;
  label: string;
} {
  switch (level) {
    case 'AAA':
      return {
        bg: 'bg-gradient-to-r from-amber-400 to-yellow-500',
        text: 'text-amber-950',
        border: 'border-amber-300',
        glow: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
        label: 'AAA+ Outstanding',
      };
    case 'AA':
      return {
        bg: 'bg-gradient-to-r from-slate-200 to-slate-300',
        text: 'text-slate-800',
        border: 'border-slate-300',
        glow: 'shadow-[0_0_8px_rgba(203,213,225,0.6)]',
        label: 'AA Excellent',
      };
    case 'A':
      return {
        bg: 'bg-gradient-to-r from-primary-500 to-primary-600',
        text: 'text-white',
        border: 'border-primary-400',
        glow: 'shadow-[0_0_8px_rgba(58,158,246,0.4)]',
        label: 'A Verified',
      };
    case 'B':
      return {
        bg: 'bg-neutral-200',
        text: 'text-neutral-700',
        border: 'border-neutral-300',
        glow: '',
        label: 'B Registered',
      };
    case 'C':
      return {
        bg: 'bg-neutral-100',
        text: 'text-neutral-600',
        border: 'border-neutral-200',
        glow: '',
        label: 'C Basic',
      };
    default:
      return {
        bg: 'bg-neutral-100',
        text: 'text-neutral-500',
        border: 'border-neutral-200',
        glow: '',
        label: 'Unranked',
      };
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const philippineRegions = [
  'NCR (Metro Manila)',
  'CAR (Cordillera)',
  'Region I (Ilocos)',
  'Region II (Cagayan Valley)',
  'Region III (Central Luzon)',
  'Region IV-A (CALABARZON)',
  'Region IV-B (MIMAROPA)',
  'Region V (Bicol)',
  'Region VI (Western Visayas)',
  'Region VII (Central Visayas)',
  'Region VIII (Eastern Visayas)',
  'Region IX (Zamboanga)',
  'Region X (Northern Mindanao)',
  'Region XI (Davao)',
  'Region XII (SOCCSKSARGEN)',
  'Region XIII (Caraga)',
  'BARMM (Muslim Mindanao)',
];

export const documentTypes = [
  'PCAB License',
  'DTI Registration',
  'SEC Registration',
  'BIR Certificate',
  "Mayor's Permit",
  'PhilGEPS Registration',
  'DOLE Registration',
  'OSS Certificate',
  'Business Permit',
  'Other',
];
