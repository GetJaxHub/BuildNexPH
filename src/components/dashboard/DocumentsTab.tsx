import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus, Pencil, Trash2, X, Loader2, AlertCircle, FileText,
  Calendar, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Document } from '@/types';
import { documentTypes, formatDate } from '@/lib/utils';
import FileUpload from '@/components/FileUpload';
import VerificationBadge from '@/components/admin/VerificationBadge';

interface Props {
  contractorId?: string;
}

const emptyForm = {
  document_type: '',
  document_name: '',
  file_url: '',
  license_number: '',
  issue_date: '',
  expiry_date: '',
  status: 'valid' as 'valid' | 'expired' | 'pending',
};

function statusIcon(status: string) {
  switch (status) {
    case 'valid':
      return <CheckCircle2 size={14} className="text-success-600" />;
    case 'expired':
      return <XCircle size={14} className="text-error-600" />;
    default:
      return <Clock size={14} className="text-warning-600" />;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'valid':
      return 'bg-success-100 text-success-700';
    case 'expired':
      return 'bg-error-100 text-error-700';
    default:
      return 'bg-warning-100 text-warning-700';
  }
}

export default function DocumentsTab({ contractorId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractorId) return;
    fetchDocuments();
  }, [contractorId]);

  const fetchDocuments = async () => {
    if (!contractorId) return;
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });
    setDocuments((data as Document[]) ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (doc: Document) => {
    setEditing(doc);
    setForm({
      document_type: doc.document_type,
      document_name: doc.document_name,
      file_url: doc.file_url,
      license_number: doc.license_number,
      issue_date: doc.issue_date ?? '',
      expiry_date: doc.expiry_date ?? '',
      status: doc.status,
    });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contractorId) return;
    setError(null);
    setSaving(true);

    const payload = {
      contractor_id: contractorId,
      document_type: form.document_type,
      document_name: form.document_name,
      file_url: form.file_url,
      license_number: form.license_number,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      status: form.status,
    };

    if (editing) {
      const { error: updateError } = await supabase
        .from('documents')
        .update(payload)
        .eq('id', editing.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('documents').insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowForm(false);
    await fetchDocuments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    const { error: deleteError } = await supabase.from('documents').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await fetchDocuments();
  };

  if (!contractorId) {
    return (
      <div className="card p-8 text-center">
        <FileText size={40} className="text-neutral-300 mx-auto mb-3" />
        <p className="text-sm text-neutral-500">Set up your company profile first to upload documents.</p>
      </div>
    );
  }

  const validCount = documents.filter((d) => d.status === 'valid').length;
  const expiredCount = documents.filter((d) => d.status === 'expired').length;

  return (
    <div>
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 mb-4">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-neutral-900">{documents.length}</p>
          <p className="text-xs text-neutral-400 mt-1">Total Documents</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-success-600">{validCount}</p>
          <p className="text-xs text-neutral-400 mt-1">Valid</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-error-600">{expiredCount}</p>
          <p className="text-xs text-neutral-400 mt-1">Expired</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900">Government Licenses & Documents</h3>
        <button onClick={openCreate} className="btn-primary !py-2">
          <Plus size={16} /> Add Document
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary-600" />
        </div>
      ) : documents.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={32} className="text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            No documents uploaded yet. Add your PCAB license, DTI registration, BIR certificate, and more.
          </p>
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
                  <span className={`badge ${statusBadge(doc.status)}`}>
                    {statusIcon(doc.status)} {doc.status}
                  </span>
                  <VerificationBadge status={doc.review_status} />
                </div>
                <p className="text-xs text-neutral-500">{doc.document_name}</p>
                {doc.review_status === 'rejected' && doc.review_notes && (
                  <p className="text-xs text-error-700 mt-1">Reviewer: {doc.review_notes}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-neutral-400">
                  {doc.license_number && <span>License #: {doc.license_number}</span>}
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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(doc)}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 rounded-lg hover:bg-error-50 text-neutral-500 hover:text-error-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="font-bold text-neutral-900">
                {editing ? 'Edit Document' : 'Add Document'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-neutral-100">
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-2.5 text-sm text-error-700">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="label">Document Type</label>
                <select
                  required
                  value={form.document_type}
                  onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                  className="input"
                >
                  <option value="">Select type</option>
                  {documentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Document Name</label>
                <input
                  type="text"
                  required
                  value={form.document_name}
                  onChange={(e) => setForm({ ...form, document_name: e.target.value })}
                  className="input"
                  placeholder="e.g. PCAB License 2024-2026"
                />
              </div>

              <div>
                <label className="label">License / Registration Number</label>
                <input
                  type="text"
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  className="input"
                  placeholder="License number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Issue Date</label>
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as 'valid' | 'expired' | 'pending' })}
                  className="input"
                >
                  <option value="valid">Valid</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <FileUpload
                label="Document File"
                value={form.file_url}
                onChange={(url) => setForm({ ...form, file_url: url })}
                folder={`documents/${contractorId}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                allowUrl
              />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editing ? 'Save Changes' : 'Add Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
