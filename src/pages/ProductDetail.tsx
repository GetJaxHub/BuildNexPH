import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, ImageIcon,
  Package, Tag, Layers, ShieldCheck, FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MessageButton from '@/components/MessageButton';
import type { Product, Contractor, Document } from '@/types';
import { formatCurrency } from '@/lib/utils';
import AccreditationBadge from '@/components/AccreditationBadge';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from('products')
        .select('*, contractor:contractors(*), category:categories(*)')
        .eq('id', id)
        .maybeSingle();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const prod = data as unknown as Product;
      setProduct(prod);
      setContractor(prod.contractor as Contractor | null);

      if (prod.contractor_id) {
        const { data: docs } = await supabase
          .from('documents')
          .select('*')
          .eq('contractor_id', prod.contractor_id)
          .order('created_at', { ascending: false });
        if (docs) setDocuments(docs as Document[]);
      }

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-neutral-100 animate-pulse rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-100 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-neutral-100 rounded animate-pulse w-1/2" />
            <div className="h-32 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Package size={48} className="text-neutral-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-neutral-700">Product not found</h1>
        <Link to="/products" className="btn-primary mt-4">Browse all products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6">
        <ArrowLeft size={16} /> Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="card overflow-hidden">
          <div className="aspect-square bg-neutral-100 flex items-center justify-center">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={64} className="text-neutral-300" />
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          {contractor && (
            <Link
              to={`/contractors/${contractor.id}`}
              className="inline-flex items-center gap-2 mb-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Building2 size={16} className="text-primary-600" />
              </div>
              <span className="text-sm font-semibold text-neutral-700 group-hover:text-primary-600 transition-colors">
                {contractor.company_name}
              </span>
              <AccreditationBadge level={contractor.accreditation_level} size="sm" />
            </Link>
          )}

          <h1 className="text-2xl font-bold text-neutral-900">{product.name}</h1>

          {product.brand && (
            <p className="text-sm text-neutral-500 mt-1">Brand: {product.brand}</p>
          )}

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary-700">{formatCurrency(product.price)}</span>
            {product.unit && <span className="text-neutral-400">/ {product.unit}</span>}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {product.stock_qty > 0 ? (
              <span className="badge bg-success-100 text-success-700 border border-success-200">
                In Stock ({product.stock_qty})
              </span>
            ) : (
              <span className="badge bg-neutral-200 text-neutral-600 border border-neutral-300">
                Out of Stock
              </span>
            )}
            {product.sku && (
              <span className="text-xs text-neutral-400">SKU: {product.sku}</span>
            )}
          </div>

          {product.description && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm text-neutral-700 mb-2">Description</h3>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Specs */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {product.category && (
              <div className="card p-3">
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                  <Layers size={12} /> Category
                </div>
                <span className="text-sm font-medium text-neutral-700">{product.category.name}</span>
              </div>
            )}
            {product.unit && (
              <div className="card p-3">
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                  <Tag size={12} /> Unit
                </div>
                <span className="text-sm font-medium text-neutral-700">{product.unit}</span>
              </div>
            )}
          </div>

          {/* Contractor contact */}
          {contractor && (
            <div className="card p-5 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-neutral-700">Supplier Information</h3>
                {contractor.verified && (
                  <span className="flex items-center gap-1 text-xs text-success-600 font-semibold">
                    <ShieldCheck size={12} /> Verified
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Building2 size={14} className="text-neutral-400" />
                  {contractor.company_name}
                </div>
                {contractor.region && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <MapPin size={14} className="text-neutral-400" />
                    {contractor.region}
                  </div>
                )}
                {contractor.phone && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Phone size={14} className="text-neutral-400" />
                    {contractor.phone}
                  </div>
                )}
                {contractor.email && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Mail size={14} className="text-neutral-400" />
                    {contractor.email}
                  </div>
                )}
              </div>
              <MessageButton contractorId={contractor.id} productId={product.id} className="mt-4" />
              <Link
                to={`/contractors/${contractor.id}`}
                className="btn-secondary w-full mt-2 !py-2"
              >
                View Full Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Documents section */}
      {documents.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-neutral-700" />
            <h2 className="text-lg font-bold text-neutral-900">
              {contractor?.company_name}'s Licenses & Documents
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => (
              <div key={doc.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700">{doc.document_type}</span>
                  </div>
                  <span className={`badge ${
                    doc.status === 'valid' ? 'bg-success-100 text-success-700' :
                    doc.status === 'expired' ? 'bg-error-100 text-error-700' :
                    'bg-warning-100 text-warning-700'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{doc.document_name}</p>
                {doc.license_number && (
                  <p className="text-xs text-neutral-400 mt-1">License #: {doc.license_number}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
