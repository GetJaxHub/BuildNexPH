import { Link } from 'react-router-dom';
import { MapPin, Package, Building2, ShieldCheck } from 'lucide-react';
import type { Contractor } from '@/types';
import AccreditationBadge from './AccreditationBadge';

interface Props {
  contractor: Contractor;
  productCount?: number;
}

export default function ContractorCard({ contractor, productCount }: Props) {
  return (
    <Link
      to={`/contractors/${contractor.id}`}
      className="card group hover:shadow-lg hover:border-primary-200 transition-all duration-200 overflow-hidden"
    >
      <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-800 relative">
        {contractor.banner_url && (
          <img
            src={contractor.banner_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="px-5 pb-5 -mt-10">
        <div className="w-16 h-16 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center overflow-hidden mb-3">
          {contractor.logo_url ? (
            <img src={contractor.logo_url} alt={contractor.company_name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <Building2 size={28} className="text-primary-600" />
          )}
        </div>

        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-neutral-900 text-sm group-hover:text-primary-700 transition-colors line-clamp-1">
            {contractor.company_name}
          </h3>
          <AccreditationBadge level={contractor.accreditation_level} size="sm" />
        </div>

        {contractor.verified && (
          <div className="flex items-center gap-1 text-xs text-success-600 mb-2">
            <ShieldCheck size={12} />
            <span className="font-medium">Verified Company</span>
          </div>
        )}

        {contractor.description && (
          <p className="text-xs text-neutral-500 line-clamp-2 mb-3">
            {contractor.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          {contractor.region && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              <span className="truncate max-w-[120px]">{contractor.region}</span>
            </span>
          )}
          {productCount !== undefined && (
            <span className="flex items-center gap-1">
              <Package size={12} />
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
