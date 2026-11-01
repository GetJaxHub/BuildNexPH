import { useState } from 'react';
import { Download, Trash2, AlertCircle, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Contractor, Product, Document } from '@/types';

export default function AccountSettingsTab() {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'deleting' | 'done'>('idle');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    setError(null);
    setExportUrl(null);

    try {
      const conRes = await supabase.from('contractors').select('*').eq('user_id', user.id).maybeSingle();
      const contractorId = (conRes.data as Contractor)?.id ?? '';
      const [prodRes, docRes] = await Promise.all([
        supabase.from('products').select('*').eq('contractor_id', contractorId),
        supabase.from('documents').select('*').eq('contractor_id', contractorId),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        contractor: conRes.data ?? null,
        products: (prodRes.data as Product[]) ?? [],
        documents: (docRes.data as Document[]) ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
    } catch {
      setError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (deleteConfirmText !== 'DELETE') {
      setError('Type DELETE in all caps to confirm.');
      return;
    }

    setDeleteStep('deleting');
    setError(null);

    try {
      const contractorId = (await supabase.from('contractors').select('id').eq('user_id', user.id).maybeSingle()).data?.id;

      if (contractorId) {
        await supabase.from('products').delete().eq('contractor_id', contractorId);
        await supabase.from('documents').delete().eq('contractor_id', contractorId);
        await supabase.from('contractors').delete().eq('id', contractorId);
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) {
        await signOut();
      }
      setDeleteStep('done');
    } catch {
      setError('Account deletion failed. Please contact support at [privacy@buildnex.ph].');
      setDeleteStep('confirm');
    }
  };

  if (deleteStep === 'done') {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-success-600" />
        </div>
        <h3 className="font-bold text-neutral-900 text-lg">Account Deleted</h3>
        <p className="text-sm text-neutral-500 mt-2 mb-4">
          Your account and all associated data have been permanently removed from BuildNexPH.
        </p>
        <a href="/" className="btn-primary">Return to Homepage</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Data Export */}
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Export Your Data</h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              Download a copy of your account data, including your company profile, product listings, and uploaded documents.
              This is your right under GDPR Article 20 (Data Portability).
            </p>
          </div>
        </div>
        {exportUrl ? (
          <a href={exportUrl} download="buildnexph-data-export.json" className="btn-primary w-full !py-2.5">
            <Download size={16} /> Download JSON File
          </a>
        ) : (
          <button onClick={handleExport} disabled={exporting} className="btn-primary w-full !py-2.5">
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <><Download size={16} /> Generate Export</>}
          </button>
        )}
      </div>

      {/* Account Deletion */}
      <div className="card p-6 border-error-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-error-50 flex items-center justify-center flex-shrink-0">
            <Trash2 size={20} className="text-error-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Delete Your Account</h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              Permanently delete your account and all associated data — company profile, products, documents, and credentials.
              This action cannot be undone. This is your right under GDPR Article 17 (Right to Erasure).
            </p>
          </div>
        </div>

        {deleteStep === 'idle' && (
          <button onClick={() => setDeleteStep('confirm')} className="btn w-full !py-2.5 bg-error-50 text-error-700 border border-error-200 hover:bg-error-100">
            <Trash2 size={16} /> Request Account Deletion
          </button>
        )}

        {deleteStep === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-error-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-error-700">
                <strong>Warning:</strong> This will permanently delete:
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Your company profile and accreditation records</li>
                  <li>All product listings</li>
                  <li>All uploaded documents and licenses</li>
                  <li>Your login credentials and session</li>
                </ul>
              </div>
            </div>
            <div>
              <label className="label">Type DELETE to confirm</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="input"
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
            {error && <p className="text-sm text-error-600">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteStep('idle'); setError(null); setDeleteConfirmText(''); }} className="btn-secondary flex-1 !py-2.5">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn flex-1 !py-2.5 bg-error-600 text-white hover:bg-error-700">
                <Trash2 size={16} /> Permanently Delete
              </button>
            </div>
          </div>
        )}

        {deleteStep === 'deleting' && (
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 py-4">
            <Loader2 size={16} className="animate-spin" /> Deleting your account...
          </div>
        )}
      </div>

      {/* Privacy rights info */}
      <div className="card p-5 bg-neutral-50">
        <div className="flex items-start gap-3">
          <FileText size={18} className="text-neutral-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-neutral-500 leading-relaxed">
            <p className="font-semibold text-neutral-700 mb-1">Your Privacy Rights</p>
            Under the Data Privacy Act of 2012 (Philippines), GDPR, and CCPA, you have the right to access,
            correct, export, and delete your personal data. To exercise any of these rights, use the tools above
            or contact us at [privacy@buildnex.ph]. See our{' '}
            <a href="/privacy-policy" className="text-primary-600 font-semibold hover:underline">Privacy Policy</a> for details.
          </div>
        </div>
      </div>
    </div>
  );
}
