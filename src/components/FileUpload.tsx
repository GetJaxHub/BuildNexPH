import { useRef, useState } from 'react';
import { Upload, Loader2, X, Link2, ImageIcon, FileIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Props {
  bucket?: string;
  folder?: string;
  accept?: string;
  value: string;
  onChange: (url: string) => void;
  label: string;
  placeholder?: string;
  type?: 'image' | 'file';
  allowUrl?: boolean;
  maxBytes?: number;
}

export default function FileUpload({
  bucket = 'contractor-uploads',
  folder = 'misc',
  accept = 'image/*',
  value,
  onChange,
  label,
  placeholder = 'https://...',
  type = 'image',
  allowUrl = true,
  maxBytes = 5 * 1024 * 1024,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > maxBytes) {
      setError(`File is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)}MB.`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'bin';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onChange(urlData.publicUrl);
      setPreviewKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    onChange('');
    setPreviewKey((k) => k + 1);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label">{label}</label>
        {allowUrl && (
          <button
            type="button"
            onClick={() => setUrlMode((v) => !v)}
            className="text-xs text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
          >
            {urlMode ? <><Upload size={12} /> Upload</> : <><Link2 size={12} /> Use URL</>}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-error-600 mb-1.5">{error}</p>
      )}

      {urlMode && allowUrl ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          placeholder={placeholder}
        />
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative border-2 border-dashed border-neutral-200 rounded-xl px-4 py-5 cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-colors group"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
              <Loader2 size={18} className="animate-spin text-primary-600" />
              Uploading...
            </div>
          ) : value ? (
            <div className="flex items-center gap-3">
              {type === 'image' ? (
                <img
                  key={previewKey}
                  src={value}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <FileIcon size={20} className="text-neutral-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500 truncate">{value}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleClear(); }}
                    className="text-xs text-error-500 font-medium hover:text-error-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary-100 transition-colors">
                {type === 'image' ? (
                  <ImageIcon size={18} className="text-neutral-400 group-hover:text-primary-500" />
                ) : (
                  <FileIcon size={18} className="text-neutral-400 group-hover:text-primary-500" />
                )}
              </div>
              <p className="text-sm text-neutral-500">
                <span className="font-medium text-primary-600">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {type === 'image' ? 'PNG, JPG, WebP' : 'PDF, PNG, JPG'} up to {Math.round(maxBytes / 1024 / 1024)}MB
              </p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

// Multi-image upload variant for project galleries
interface MultiProps {
  bucket?: string;
  folder?: string;
  values: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function MultiImageUpload({
  bucket = 'contractor-uploads',
  folder = 'projects',
  values,
  onChange,
  max = 6,
}: MultiProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    setError(null);
    const remaining = max - values.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (toUpload.length === 0) {
      setError(`You can upload a maximum of ${max} images.`);
      return;
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} exceeds 5MB and was skipped.`);
          continue;
        }
        const ext = file.name.split('.').pop() ?? 'bin';
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      }
      onChange([...values, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label">Project Images</label>
        <span className="text-xs text-neutral-400">{values.length} / {max}</span>
      </div>

      {error && (
        <p className="text-xs text-error-600 mb-1.5">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {values.map((url, i) => (
          <div
            key={i}
            className="relative w-24 h-24 rounded-lg overflow-hidden border border-neutral-200 group"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {values.length < max && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-primary-600" />
            ) : (
              <div className="text-center">
                <Upload size={16} className="text-neutral-400 mx-auto mb-0.5" />
                <span className="text-[10px] text-neutral-400">Add</span>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
        className="hidden"
      />
    </div>
  );
}
