import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus, Pencil, Trash2, X, Loader2, AlertCircle, Package,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import FileUpload from '@/components/FileUpload';

interface Props {
  contractorId?: string;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  unit: '',
  stock_qty: '',
  image_url: '',
  sku: '',
  brand: '',
  category_id: '',
};

export default function ProductsTab({ contractorId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!contractorId) return;
    fetchProducts();
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, [contractorId]);

  const fetchProducts = async () => {
    if (!contractorId) return;
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, contractor:contractors(*), category:categories(*)')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });
    setProducts((data as unknown as Product[]) ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      unit: product.unit,
      stock_qty: String(product.stock_qty),
      image_url: product.image_url,
      sku: product.sku,
      brand: product.brand,
      category_id: product.category_id ?? '',
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
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      unit: form.unit,
      stock_qty: parseInt(form.stock_qty) || 0,
      image_url: form.image_url,
      sku: form.sku,
      brand: form.brand,
      category_id: form.category_id || null,
    };

    if (editing) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editing.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('products').insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowForm(false);
    await fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const { error: deleteError } = await supabase.from('products').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await fetchProducts();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!contractorId) {
    return (
      <div className="card p-8 text-center">
        <Package size={40} className="text-neutral-300 mx-auto mb-3" />
        <p className="text-sm text-neutral-500">Set up your company profile first to manage products.</p>
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
            placeholder="Search products..."
            className="input pl-9 !py-2"
          />
        </div>
        <button onClick={openCreate} className="btn-primary !py-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={32} className="text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            {products.length === 0 ? 'No products yet. Add your first product!' : 'No products match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => (
            <div key={product.id} className="card p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package size={20} className="text-neutral-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-neutral-900 truncate">{product.name}</h4>
                <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                  <span className="font-semibold text-primary-600">{formatCurrency(product.price)}</span>
                  {product.unit && <span>/ {product.unit}</span>}
                  {product.brand && <span>{product.brand}</span>}
                  <span className={product.stock_qty > 0 ? 'text-success-600' : 'text-neutral-400'}>
                    {product.stock_qty > 0 ? `${product.stock_qty} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(product)}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
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
                {editing ? 'Edit Product' : 'Add New Product'}
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

              <div>
                <label className="label">Product Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Portland Cement Type I"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="input"
                    placeholder="per sack"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stock Quantity</label>
                  <input
                    type="number"
                    value={form.stock_qty}
                    onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Brand (optional)</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="input"
                    placeholder="e.g. Holcim"
                  />
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">SKU (optional)</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="input"
                  placeholder="Product SKU"
                />
              </div>

              <FileUpload
                label="Product Image"
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                folder={`products/${contractorId}`}
                type="image"
                allowUrl
              />

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input resize-none"
                  placeholder="Product specifications and details..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editing ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
