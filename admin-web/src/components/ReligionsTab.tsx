import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Globe2, Check, X, Loader2 } from 'lucide-react';
import { DbReligion } from '../types';
import { apiCreateReligion, apiUpdateReligion, apiDeleteReligion } from '../lib/api-client';

interface ReligionsTabProps {
  religions: DbReligion[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export const ReligionsTab: React.FC<ReligionsTabProps> = ({
  religions,
  onRefresh,
  showToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReligion, setEditingReligion] = useState<Partial<DbReligion> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingReligion({
      name_en: '',
      name_hi: '',
      slug: '',
      icon_url: '🕉️',
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (r: DbReligion) => {
    setEditingReligion({ ...r });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReligion?.name_en || !editingReligion?.name_hi || !editingReligion?.slug) {
      showToast('error', 'Please enter English name, Hindi name, and slug.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingReligion.id) {
        await apiUpdateReligion(editingReligion.id, {
          name_en: editingReligion.name_en,
          name_hi: editingReligion.name_hi,
          slug: editingReligion.slug,
          icon_url: editingReligion.icon_url || null,
          is_active: editingReligion.is_active ?? true,
        });
        showToast('success', 'Religion updated successfully via API!');
      } else {
        await apiCreateReligion({
          name_en: editingReligion.name_en,
          name_hi: editingReligion.name_hi,
          slug: editingReligion.slug,
          icon_url: editingReligion.icon_url || null,
          is_active: editingReligion.is_active ?? true,
        });
        showToast('success', 'New religion created successfully via API!');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save religion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiDeleteReligion(deleteId);
      showToast('success', `"${deleteName}" has been deleted successfully.`);
      setDeleteId(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete religion');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            Religions Manager
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Manage spiritual traditions, icons, slug identifiers, and activation status
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm shadow-orange-950/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Religion</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-6 py-4">Icon / Symbol</th>
                <th className="px-6 py-4">Title (English / Hindi)</th>
                <th className="px-6 py-4">Slug Identifier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {religions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    No religions found. Click the button above to add one.
                  </td>
                </tr>
              ) : (
                religions.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-2xl">{r.icon_url || '🕉️'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{r.name_en}</div>
                      <div className="text-xs text-stone-400">{r.name_hi}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-stone-500">
                      {r.slug}
                    </td>
                    <td className="px-6 py-4">
                      {r.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                          <X className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 text-stone-400 hover:text-orange-600 rounded-lg hover:bg-stone-100 transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(r.id);
                          setDeleteName(r.name_en);
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && editingReligion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-4">
              {editingReligion.id ? 'Edit Religion' : 'Add New Religion'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Name in English *
                </label>
                <input
                  type="text"
                  required
                  value={editingReligion.name_en || ''}
                  onChange={(e) => setEditingReligion({ ...editingReligion, name_en: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="e.g. Hinduism"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Name in Hindi *
                </label>
                <input
                  type="text"
                  required
                  value={editingReligion.name_hi || ''}
                  onChange={(e) => setEditingReligion({ ...editingReligion, name_hi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="e.g. सनातन धर्म"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Slug / Unique Key *
                </label>
                <input
                  type="text"
                  required
                  value={editingReligion.slug || ''}
                  onChange={(e) => setEditingReligion({ ...editingReligion, slug: e.target.value.toLowerCase().trim() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                  placeholder="e.g. hinduism"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Icon or Symbol
                </label>
                <input
                  type="text"
                  value={editingReligion.icon_url || ''}
                  onChange={(e) => setEditingReligion({ ...editingReligion, icon_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="e.g. 🕉️ or https://..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="relActive"
                  checked={editingReligion.is_active ?? true}
                  onChange={(e) => setEditingReligion({ ...editingReligion, is_active: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                />
                <label htmlFor="relActive" className="text-sm font-medium text-stone-800">
                  Active (Visible in mobile app)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Religion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-stone-600 mb-6">
              Are you sure you want to permanently delete <span className="font-bold text-stone-900">"{deleteName}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
