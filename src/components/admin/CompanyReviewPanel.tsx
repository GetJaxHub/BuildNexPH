import { useCallback, useEffect, useState } from 'react';
import { X, Loader2, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Contractor, Document, VerificationStatus } from '@/types';
import VerificationBadge from '@/components/admin/VerificationBadge';

interface Props {
  contractor: Contractor;
  onClose: () => void;
  onSaved: () => void;
}

const HTTP_URL = /^https?:\/\//i;

export default function CompanyReviewPanel({ contractor, onClose, onSaved }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [notes, setNotes] = useState(contractor.verification_notes);
  const [saving, setSaving] = useState<VerificationStatus | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [docReasons, setDocReasons] = useState<Record<string, string>>({});
  const [docSaving, setDocSaving] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('contractor_id', contractor.id)
      .order('created_at', { ascending: false });
    if (error) setDocsError(error.message);
    else setDocuments((data as Document[]) ?? []);
    setDocsLoading(false);
  }, [contractor.id]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const reviewDocument = async (doc: Document, status: VerificationStatus) => {
    const reason = (docReasons[doc.id] ?? '').trim();
    if (status === 'rejected' && !reason) {
      setSaveError(`Write a reason under "${doc.document_name}" before rejecting it.`);
      return;
    }
    setDocSaving(doc.id);
    setSaveError(null);
    const { error } = await supabase.rpc('admin_review_document', {
      p_document_id: doc.id,
      p_status: status,
      p_notes: status === 'rejected' ? reason : '',
    });
    setDocSaving(null);
    if (error) setSaveError(error.message);
    else await loadDocuments();
  };

  const allDocsApproved = documents.length > 0 && documents.every((d) => d.review_status === 'approved');

  const decide = async (status: VerificationStatus) => {
    const trimmed = notes.trim();
    if (status === 'rejected' && !trimmed) {
      setSaveError('Add a reason in the notes before rejecting a company.');
      return;
    }
    setSaving(status);
    setSaveError(null);
    const { error } = await supabase.rpc('admin_set_verification', {
      p_contractor_id: contractor.id,
      p_status: status,
      p_notes: trimmed,
    });
    setSaving(null);
    if (error) {
      setSaveError(error.message);
      return;
    }
    onSaved();
  };

  const details: { label: string; value: string }[] = [
    { label: 'Contact person', value: contractor.contact_person },
    { label: 'Email', value: contractor.email },
    { label: 'Phone', value: contractor.phone },
    { label: 'Region', value: contractor.region },
    { label: 'Address', value: contractor.address },
    { label: 'PCAB license', value: contractor.pcab_license_no },
    { label: 'Website', value: contractor.website },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close review" onClick={onClose} className="absolute inset-0 bg-neutral-900/40" />
      <aside className="relative w-full max-w-xl h-full bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-neutral-900 truncate">{contractor.company_name}</h2>
            <div className="mt-2">
              <VerificationBadge status={contractor.verification_status} />
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          <section>
            <h3 className="font-semibold text-neutral-900 mb-3">Company profile</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-neutral-500">{item.label}</dt>
                  <dd className="text-neutral-900 break-words">{item.value || 'Not provided'}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-xs text-neutral-500">Description</dt>
                <dd className="text-neutral-900 whitespace-pre-line">{contractor.description || 'Not provided'}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="font-semibold text-neutral-900 mb-3">Submitted documents</h3>
            {docsLoading ? (
              <Loader2 size={20} className="animate-spin text-primary-600" />
            ) : docsError ? (
              <p className="text-sm text-error-700">Documents could not be loaded: {docsError}</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-neutral-500">No documents have been submitted.</p>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li key={doc.id} className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                    <FileText size={18} className="text-primary-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{doc.document_name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {doc.document_type}
                        {doc.license_number ? ` · No. ${doc.license_number}` : ''}
                        {doc.expiry_date ? ` · Expires ${formatDate(doc.expiry_date)}` : ''}
                      </p>
                    </div>
                    {HTTP_URL.test(doc.file_url) ? (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 flex-shrink-0"
                      >
                        View <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400 flex-shrink-0">No file</span>
                    )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-7">
                      <VerificationBadge status={doc.review_status} />
                      {doc.review_status === 'rejected' && doc.review_notes && (
                        <span className="text-xs text-error-700">{doc.review_notes}</span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pl-7">
                      <input
                        className="input !py-1.5 text-sm flex-1"
                        placeholder="Reason (needed to reject)"
                        maxLength={2000}
                        aria-label={`Rejection reason for ${doc.document_name}`}
                        value={docReasons[doc.id] ?? ''}
                        onChange={(e) => setDocReasons((r) => ({ ...r, [doc.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => reviewDocument(doc, 'approved')}
                        disabled={docSaving !== null || doc.review_status === 'approved'}
                        className="btn-primary !py-1.5 text-sm"
                      >
                        {docSaving === doc.id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                      </button>
                      <button
                        onClick={() => reviewDocument(doc, 'rejected')}
                        disabled={docSaving !== null}
                        className="btn !py-1.5 text-sm bg-error-600 text-white hover:bg-error-700"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-semibold text-neutral-900 mb-1">Decision</h3>
            <p className="text-sm text-neutral-500 mb-3">
              Approving marks the company as verified. Rejecting requires a reason in the notes, which the company can see.
            </p>
            {!docsLoading && !allDocsApproved && (
              <p className="text-sm text-warning-700 mb-3">
                {documents.length === 0
                  ? 'The company can be approved once it has submitted documents.'
                  : 'Approve every document above before approving the company.'}
              </p>
            )}
            <label className="label" htmlFor="review-notes">Review notes</label>
            <textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              className="input"
              placeholder="e.g. PCAB license matches the registry. Please upload a current business permit."
            />

            {saveError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => decide('approved')}
                disabled={saving !== null || !allDocsApproved}
                className="btn-primary !py-2.5"
              >
                {saving === 'approved' ? <Loader2 size={16} className="animate-spin" /> : 'Approve'}
              </button>
              <button
                onClick={() => decide('rejected')}
                disabled={saving !== null}
                className="btn !py-2.5 bg-error-600 text-white hover:bg-error-700"
              >
                {saving === 'rejected' ? <Loader2 size={16} className="animate-spin" /> : 'Reject'}
              </button>
              <button
                onClick={() => decide('pending')}
                disabled={saving !== null || contractor.verification_status === 'pending'}
                className="btn-secondary !py-2.5"
              >
                {saving === 'pending' ? <Loader2 size={16} className="animate-spin" /> : 'Reset to pending'}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
