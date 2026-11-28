import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Globe, ImageIcon,
  Package, ShieldCheck, FileText, Calendar, Award,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MessageButton from '@/components/MessageButton';
import type { Contractor, Product, Document } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { recordProfileView } from '@/lib/analytics';
import AccreditationBadge from '@/components/AccreditationBadge';
import ProductCard from '@/components/ProductCard';
import VerificationBadge from '@/components/admin/VerificationBadge';

export default function ContractorProfile() {
  const { id } = useParams<{ id: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;

      const [conRes, prodRes, docRes] = await Promise.all([
        supabase.from('contractors').select('*').eq('id', id).maybeSingle(),
        supabase.from('products').select('*, contractor:contractors(*), category:categories(*)').eq('contractor_id', id).order('created_at', { ascending: false }),
        supabase.from('documents').select('*').eq('contractor_id', id).order('created_at', { ascending: false }),
      ]);

      if (!conRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setContractor(conRes.data as Contractor);
      recordProfileView(id);
      setProducts((prodRes.data as unknown as Product[]) ?? []);
      setDocuments((docRes.data as Document[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-48 bg-neutral-100 animate-pulse rounded-xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-64 bg-neutral-100 animate-pulse rounded-xl" />
          <div className="lg:col-span-2 h-64 bg-neutral-100 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !contractor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Building2 size={48} className="text-neutral-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-neutral-700">Contractor not found</h1>
        <Link to="/contractors" className="btn-primary mt-4">Browse all contractors</Link>
      </div>
    );
  }

  const validDocs = documents.filter((d) => d.status === 'valid');
  const expiredDocs = documents.filter((d) => d.status === 'expired');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/contractors" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6">
        <ArrowLeft size={16} /> Back to contractors
      </Link>

      {/* Banner */}
      <div className="relative h-40 sm:h-56 rounded-xl overflow-hidden bg-gradient-to-r from-primary-700 to-primary-900 mb-16">
        {contractor.banner_url && (
          <img src={contractor.banner_url} alt="" loading="lazy" className="w-full h-full object-cover" />
        )}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <AccreditationBadge level={contractor.accreditation_level} size="lg" />
          {contractor.verified && (
            <span className="badge bg-success-500 text-white border border-success-400 shadow-sm">
              <ShieldCheck size={14} /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Logo + name */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8 -mt-16 sm:-mt-12">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
          {contractor.logo_url ? (
            <img src={contractor.logo_url} alt={contractor.company_name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <Building2 size={32} className="text-primary-600" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900">{contractor.company_name}</h1>
          {contractor.region && (
            <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
              <MapPin size={14} /> {contractor.region}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact card */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-neutral-700 mb-3">Contact Information</h3>
            <MessageButton contractorId={contractor.id} className="mb-4" />
            <div className="space-y-3 text-sm">
              {contractor.contact_person && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <Building2 size={14} className="text-neutral-400" />
                  {contractor.contact_person}
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
              {contractor.address && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <MapPin size={14} className="text-neutral-400" />
                  {contractor.address}
                </div>
              )}
              {/^https?:\/\//i.test(contractor.website ?? '') && (
                <a
                  href={contractor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <Globe size={14} />
                  Visit website
                </a>
              )}
            </div>
          </div>

          {/* Accreditation card */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-neutral-700 mb-3">Accreditation</h3>
            <div className="flex items-center gap-3 mb-4">
              <AccreditationBadge level={contractor.accreditation_level} size="lg" />
            </div>
            <div className="space-y-2 text-sm">
              {contractor.pcab_license_no && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Award size={14} /> PCAB License
                  </span>
                  <span className="font-medium text-neutral-700">{contractor.pcab_license_no}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 flex items-center gap-1.5">
                  <FileText size={14} /> Valid Documents
                </span>
                <span className="font-medium text-success-600">{validDocs.length}</span>
              </div>
              {expiredDocs.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <FileText size={14} /> Expired Documents
                  </span>
                  <span className="font-medium text-error-600">{expiredDocs.length}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 flex items-center gap-1.5">
                  <Package size={14} /> Products Listed
                </span>
                <span className="font-medium text-neutral-700">{products.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          {contractor.description && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">About the Company</h2>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {contractor.description}
              </p>
            </div>
          )}

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Products & Materials</h2>
              <span className="text-sm text-neutral-400">{products.length} listings</span>
            </div>
            {products.length === 0 ? (
              <div className="card p-8 text-center">
                <Package size={32} className="text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No products listed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">
                Licenses & Government Documents
              </h2>
              <span className="text-sm text-neutral-400">{documents.length} documents</span>
            </div>
            {documents.length === 0 ? (
              <div className="card p-8 text-center">
                <FileText size={32} className="text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="card p-4 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      doc.status === 'valid' ? 'bg-success-50 text-success-600' :
                      doc.status === 'expired' ? 'bg-error-50 text-error-600' :
                      'bg-warning-50 text-warning-600'
                    }`}>
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-neutral-700">{doc.document_type}</span>
                        <span className={`badge ${
                          doc.status === 'valid' ? 'bg-success-100 text-success-700' :
                          doc.status === 'expired' ? 'bg-error-100 text-error-700' :
                          'bg-warning-100 text-warning-700'
                        }`}>
                          {doc.status}
                        </span>
                        <VerificationBadge status={doc.review_status} />
                      </div>
                      <p className="text-xs text-neutral-500">{doc.document_name}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-neutral-400">
                        {doc.license_number && (
                          <span>License #: {doc.license_number}</span>
                        )}
                        {doc.issue_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> Issued: {formatDate(doc.issue_date)}
                          </span>
                        )}
                        {doc.expiry_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> Expires: {formatDate(doc.expiry_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
