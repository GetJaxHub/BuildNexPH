import { Link } from 'react-router-dom';
import { MapPin, Package, Building2, ImageIcon } from 'lucide-react';
import type { Product, Contractor } from '@/types';
import { formatCurrency } from '@/lib/utils';
import AccreditationBadge from './AccreditationBadge';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const contractor = product.contractor as Contractor | undefined;

  return (
    <Link
      to={`/products/${product.id}`}
      className="card group hover:shadow-lg hover:border-primary-200 transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <ImageIcon size={40} />
          </div>
        )}
        {product.stock_qty > 0 ? (
          <span className="absolute top-2 left-2 badge bg-success-100 text-success-700 border border-success-200">
            In Stock
          </span>
        ) : (
          <span className="absolute top-2 left-2 badge bg-neutral-200 text-neutral-600 border border-neutral-300">
            Out of Stock
          </span>
        )}
        {contractor && (
          <div className="absolute top-2 right-2">
            <AccreditationBadge level={contractor.accreditation_level} size="sm" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
          <Building2 size={12} />
          <span className="truncate">{contractor?.company_name ?? 'Unknown'}</span>
        </div>
        <h3 className="font-semibold text-neutral-900 text-sm line-clamp-2 group-hover:text-primary-700 transition-colors">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-xs text-neutral-500 mt-0.5">{product.brand}</p>
        )}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary-700">
              {formatCurrency(product.price)}
            </span>
            {product.unit && (
              <span className="text-xs text-neutral-400">/ {product.unit}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
