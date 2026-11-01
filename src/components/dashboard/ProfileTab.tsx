import { useState, type FormEvent } from 'react';
import { Loader2, AlertCircle, Save, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { philippineRegions } from '@/lib/utils';
import AccreditationBadge from '@/components/AccreditationBadge';
import FileUpload from '@/components/FileUpload';
import type { Contractor, VerificationStatus } from '@/types';
import VerificationBadge from '@/components/admin/VerificationBadge';

interface Props {
  contractor: Contractor | null;
  onSaved: () => Promise<void>;
}

const VERIFICATION_COPY: Record<VerificationStatus, string> = {
  pending: 'Your company is awaiting review. An administrator will check your profile and documents.',
  approved: 'Your company has been verified by BuildNexPH.',
  rejected: 'Your verification was not approved. See the reviewer notes below.',
};

export default function ProfileTab({ contractor, onSaved }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: contractor?.company_name ?? '',
    description: contractor?.description ?? '',
    pcab_license_no: contractor?.pcab_license_no ?? '',
    contact_person: contractor?.contact_person ?? '',
    phone: contractor?.phone ?? '',
    email: contractor?.email ?? user?.email ?? '',
    address: contractor?.address ?? '',
    region: contractor?.region ?? '',
    website: contractor?.website ?? '',
    logo_url: contractor?.logo_url ?? '',
    banner_url: contractor?.banner_url ?? '',
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!contractor) {
      if (!user) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }
      const { error: insertError } = await supabase.from('contractors').insert({
        user_id: user.id,
        company_name: form.company_name,
        description: form.description,
        pcab_license_no: form.pcab_license_no,
        contact_person: form.contact_person,
        phone: form.phone,
        email: form.email,
        address: form.address,
        region: form.region,
        website: form.website,
        logo_url: form.logo_url,
        banner_url: form.banner_url,
      });
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: updateError } = await supabase
        .from('contractors')
        .update({
          company_name: form.company_name,
          description: form.description,
          pcab_license_no: form.pcab_license_no,
          contact_person: form.contact_person,
          phone: form.phone,
          email: form.email,
          address: form.address,
          region: form.region,
          website: form.website,
          logo_url: form.logo_url,
          banner_url: form.banner_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractor.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    }

    await onSaved();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 px-4 py-3 text-sm text-success-700 animate-slide-down">
          <CheckCircle2 size={16} /> Profile saved successfully.
        </div>
      )}

      {contractor && (
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <ShieldCheck size={18} className="text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">Verification status</p>
                <p className="text-xs text-neutral-500 mt-0.5">{VERIFICATION_COPY[contractor.verification_status]}</p>
              </div>
            </div>
            <VerificationBadge status={contractor.verification_status} />
          </div>
          {contractor.verification_notes && (
            <div className="mt-4 rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm text-neutral-700">
              <strong>Reviewer notes:</strong> {contractor.verification_notes}
            </div>
          )}
        </div>
      )}

      {/* Basic Info */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Company Information</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Company Name</label>
            <input
              type="text"
              required
              value={form.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="input"
              placeholder="e.g. BuildRight Construction Inc."
            />
          </div>
          <div>
            <label className="label">Company Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="input resize-none"
              placeholder="Tell buyers about your company, expertise, and track record..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Accreditation Level</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                {contractor ? (
                  <AccreditationBadge level={contractor.accreditation_level} size="md" />
                ) : (
                  <span className="text-sm text-neutral-400">Not yet assessed</span>
                )}
                <Lock size={12} className="text-neutral-400 ml-auto" />
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Accreditation is assigned by BuildNexPH admins after document review. Contact support to request a review.
              </p>
            </div>
            <div>
              <label className="label">PCAB License Number</label>
              <input
                type="text"
                value={form.pcab_license_no}
                onChange={(e) => handleChange('pcab_license_no', e.target.value)}
                className="input"
                placeholder="e.g. AAA-12345-CON"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Contact Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Person</label>
            <input
              type="text"
              value={form.contact_person}
              onChange={(e) => handleChange('contact_person', e.target.value)}
              className="input"
              placeholder="Juan Dela Cruz"
            />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="input"
              placeholder="+63 917 123 4567"
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="input"
              placeholder="company@email.com"
            />
          </div>
          <div>
            <label className="label">Website (optional)</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Location</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Region</label>
            <select
              value={form.region}
              onChange={(e) => handleChange('region', e.target.value)}
              className="input"
            >
              <option value="">Select your region</option>
              {philippineRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Business Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="input"
              placeholder="Street, City, Province"
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Branding</h3>
        <div className="space-y-4">
          <FileUpload
            label="Logo Image"
            value={form.logo_url}
            onChange={(url) => handleChange('logo_url', url)}
            folder={`logos/${contractor?.id ?? 'new'}`}
            type="image"
            allowUrl
          />
          <FileUpload
            label="Banner Image"
            value={form.banner_url}
            onChange={(url) => handleChange('banner_url', url)}
            folder={`banners/${contractor?.id ?? 'new'}`}
            type="image"
            allowUrl
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary !py-3 !px-6">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={16} />}
          {contractor ? 'Save Changes' : 'Create Profile'}
        </button>
      </div>
    </form>
  );
}
