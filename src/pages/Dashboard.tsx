import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Building2, Package, FileText, Loader2, Settings,
  Briefcase,
} from 'lucide-react';
import ProfileTab from '@/components/dashboard/ProfileTab';
import ProductsTab from '@/components/dashboard/ProductsTab';
import ProjectsTab from '@/components/dashboard/ProjectsTab';
import DocumentsTab from '@/components/dashboard/DocumentsTab';
import AccountSettingsTab from '@/components/dashboard/AccountSettingsTab';

type Tab = 'overview' | 'profile' | 'products' | 'projects' | 'documents' | 'settings';

export default function Dashboard() {
  const { user, accountType, contractor, loading, refreshContractor } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (accountType === 'buyer') {
    return <Navigate to="/account" replace />;
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Account & Privacy', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Contractor Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {contractor ? contractor.company_name : 'Set up your company profile to get started'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {tab === 'overview' && <OverviewTab contractor={contractor} setTab={setTab} />}
        {tab === 'profile' && <ProfileTab contractor={contractor} onSaved={refreshContractor} />}
        {tab === 'products' && <ProductsTab contractorId={contractor?.id} />}
        {tab === 'projects' && <ProjectsTab contractorId={contractor?.id} />}
        {tab === 'documents' && <DocumentsTab contractorId={contractor?.id} />}
        {tab === 'settings' && <AccountSettingsTab />}
      </div>
    </div>
  );
}

function OverviewTab({
  contractor,
  setTab,
}: {
  contractor: ReturnType<typeof useAuth>['contractor'];
  setTab: (t: Tab) => void;
}) {
  if (!contractor) {
    return (
      <div className="card p-8 text-center">
        <Building2 size={40} className="text-neutral-300 mx-auto mb-3" />
        <h3 className="font-semibold text-neutral-700">No company profile yet</h3>
        <p className="text-sm text-neutral-500 mt-1 mb-4">
          Create your company profile to start listing products and uploading documents.
        </p>
        <button onClick={() => setTab('profile')} className="btn-primary">
          Set Up Profile
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Building2 size={18} />
          </div>
        </div>
        <p className="text-xs text-neutral-400">Accreditation Level</p>
        <p className="text-lg font-bold text-neutral-900">{contractor.accreditation_level}</p>
        <button onClick={() => setTab('profile')} className="text-xs text-primary-600 font-semibold mt-2 hover:text-primary-700">
          Edit profile →
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center">
            <Package size={18} />
          </div>
        </div>
        <p className="text-xs text-neutral-400">Products Listed</p>
        <p className="text-lg font-bold text-neutral-900">Manage</p>
        <button onClick={() => setTab('products')} className="text-xs text-primary-600 font-semibold mt-2 hover:text-primary-700">
          Go to products →
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center">
            <Briefcase size={18} />
          </div>
        </div>
        <p className="text-xs text-neutral-400">Projects</p>
        <p className="text-lg font-bold text-neutral-900">Manage</p>
        <button onClick={() => setTab('projects')} className="text-xs text-primary-600 font-semibold mt-2 hover:text-primary-700">
          Go to projects →
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
            <FileText size={18} />
          </div>
        </div>
        <p className="text-xs text-neutral-400">Documents</p>
        <p className="text-lg font-bold text-neutral-900">Manage</p>
        <button onClick={() => setTab('documents')} className="text-xs text-primary-600 font-semibold mt-2 hover:text-primary-700">
          Go to documents →
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <LayoutDashboard size={18} />
          </div>
        </div>
        <p className="text-xs text-neutral-400">Verification Status</p>
        <p className="text-lg font-bold text-neutral-900">{contractor.verified ? 'Verified' : 'Pending'}</p>
      </div>
    </div>
  );
}
