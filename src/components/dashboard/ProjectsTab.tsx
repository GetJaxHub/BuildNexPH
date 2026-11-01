import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus, Pencil, Trash2, X, Loader2, AlertCircle, Building2,
  Search, MapPin, Calendar, ImageIcon, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { MultiImageUpload } from '@/components/FileUpload';

interface Props {
  contractorId?: string;
}

const emptyForm = {
  building_name: '',
  description: '',
  location: '',
  project_date: '',
  image_urls: [] as string[],
};

export default function ProjectsTab({ contractorId }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!contractorId) return;
    fetchProjects();
  }, [contractorId]);

  const fetchProjects = async () => {
    if (!contractorId) return;
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setForm({
      building_name: project.building_name,
      description: project.description,
      location: project.location,
      project_date: project.project_date ?? '',
      image_urls: project.image_urls ?? [],
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
      building_name: form.building_name,
      description: form.description,
      location: form.location,
      project_date: form.project_date || null,
      image_urls: form.image_urls,
    };

    if (editing) {
      const { error: updateError } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', editing.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('projects').insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowForm(false);
    await fetchProjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await fetchProjects();
  };

  const filtered = projects.filter((p) =>
    p.building_name.toLowerCase().includes(search.toLowerCase())
  );

  if (!contractorId) {
    return (
      <div className="card p-8 text-center">
        <Building2 size={40} className="text-neutral-300 mx-auto mb-3" />
        <p className="text-sm text-neutral-500">Set up your company profile first to manage projects.</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 mb-4">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input pl-9 !py-2"
          />
        </div>
        <button onClick={openCreate} className="btn-primary !py-2">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={32} className="text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            {projects.length === 0 ? 'No projects yet. Add your first completed project!' : 'No projects match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((project) => (
            <div key={project.id} className="card overflow-hidden">
              <div className="h-40 bg-neutral-100 flex items-center justify-center overflow-hidden">
                {project.image_urls && project.image_urls.length > 0 ? (
                  <img src={project.image_urls[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-neutral-300">
                    <ImageIcon size={32} />
                    <span className="text-xs mt-1">No image</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="text-sm font-semibold text-neutral-900 truncate">{project.building_name}</h4>
                {project.location && (
                  <p className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
                    <MapPin size={11} /> {project.location}
                  </p>
                )}
                {project.project_date && (
                  <p className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
                    <Calendar size={11} /> {formatDate(project.project_date)}
                  </p>
                )}
                <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{project.description}</p>
                {project.image_urls && project.image_urls.length > 1 && (
                  <p className="text-xs text-neutral-400 mt-1">
                    {project.image_urls.length} images
                  </p>
                )}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-neutral-100">
                  <button
                    onClick={() => openEdit(project)}
                    className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 rounded-lg hover:bg-error-50 text-neutral-500 hover:text-error-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                {editing ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-neutral-100">
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-2.5 text-sm text-error-700">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* NDA notice */}
              <div className="flex items-start gap-2 rounded-lg bg-warning-50 border border-warning-200 px-4 py-2.5 text-sm text-warning-700">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>Please do not upload projects with NDA.</span>
              </div>

              <div>
                <label className="label">Building Name</label>
                <input
                  type="text"
                  required
                  value={form.building_name}
                  onChange={(e) => setForm({ ...form, building_name: e.target.value })}
                  className="input"
                  placeholder="e.g. Ayala Tower One"
                />
              </div>

              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="input"
                  placeholder="e.g. Makati City, Metro Manila"
                />
              </div>

              <div>
                <label className="label">Project Date (optional)</label>
                <input
                  type="date"
                  value={form.project_date}
                  onChange={(e) => setForm({ ...form, project_date: e.target.value })}
                  className="input"
                />
              </div>

              <MultiImageUpload
                values={form.image_urls}
                onChange={(urls) => setForm({ ...form, image_urls: urls })}
                folder={`projects/${contractorId}`}
                max={6}
              />

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input resize-none"
                  placeholder="Project scope, duration, value, and key highlights..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editing ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
