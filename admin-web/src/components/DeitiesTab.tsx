import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Sparkles, UploadCloud, Check, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { DbDeity } from '../types';
import { apiCreateDeity, apiUpdateDeity, apiDeleteDeity, apiUploadFile } from '../lib/api-client';

interface DeitiesTabProps {
  deities: DbDeity[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export const DeitiesTab: React.FC<DeitiesTabProps> = ({
  deities,
  onRefresh,
  showToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeity, setEditingDeity] = useState<Partial<DbDeity> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingDeity({
      name_en: '',
      name_hi: '',
      significance: '',
      display_order: deities.length + 1,
      is_popular: true,
      color: '#FF6F00',
      avatar_icon: '🕉️',
      image_url: null,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (d: DbDeity) => {
    setEditingDeity({ ...d });
    setModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setUploadingImage(true);
    try {
      // Upload via backend API
      const publicUrl = await apiUploadFile('deity-images', file);
      setEditingDeity((prev) => ({ ...prev, image_url: publicUrl }));
      showToast('success', 'Deity photo uploaded successfully via API!');
    } catch (err: any) {
      showToast('error', err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeity?.name_en || !editingDeity?.name_hi) {
      showToast('error', 'Please provide both English and Hindi names.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<DbDeity, 'id'> = {
        name_en: editingDeity.name_en,
        name_hi: editingDeity.name_hi,
        significance: editingDeity.significance || '',
        display_order: Number(editingDeity.display_order) || 1,
        is_popular: Boolean(editingDeity.is_popular),
        color: editingDeity.color || '#FF6F00',
        avatar_icon: editingDeity.avatar_icon || '🕉️',
        image_url: editingDeity.image_url || null,
        associated_day_hi: editingDeity.associated_day_hi || null,
        associated_day_en: editingDeity.associated_day_en || null,
      };

      if (editingDeity.id) {
        await apiUpdateDeity(editingDeity.id, payload);
        showToast('success', 'Deity record updated successfully!');
      } else {
        await apiCreateDeity(payload);
        showToast('success', 'New deity created successfully!');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save deity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiDeleteDeity(deleteId);
      showToast('success', `"${deleteName}" has been deleted successfully.`);
      setDeleteId(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete deity');
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
            Deities Manager
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Manage home screen avatars, images, display order, significance, and popular flags
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm shadow-orange-950/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Deity</span>
        </button>
      </div>

      {/* Grid Cards of Deities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deities.map((d) => (
          <div
            key={d.id}
            className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                {d.image_url ? (
                  <img
                    src={d.image_url}
                    alt={d.name_en}
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-3xl flex-shrink-0">
                    {d.avatar_icon || '🕉️'}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-stone-900 truncate">
                      {d.name_en}
                    </h3>
                    {d.is_popular && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 font-medium truncate">
                    {d.name_hi}
                  </p>
                  <p className="text-[11px] text-orange-600 font-semibold mt-1">
                    Display Order: #{d.display_order}
                  </p>
                </div>
              </div>

              {d.significance && (
                <p className="text-xs text-stone-600 line-clamp-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100 mb-4">
                  {d.significance}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
              <span className="text-stone-400">
                {d.associated_day_en || 'Daily Prayer'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(d)}
                  className="p-1.5 text-stone-400 hover:text-orange-600 rounded-lg hover:bg-stone-50 transition-colors"
                  title="Edit Record"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setDeleteId(d.id);
                    setDeleteName(d.name_en);
                  }}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && editingDeity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 my-8">
            <h3 className="text-lg font-bold text-stone-900 mb-4">
              {editingDeity.id ? 'Edit Deity Record' : 'Add New Deity'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Name in English *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDeity.name_en || ''}
                    onChange={(e) => setEditingDeity({ ...editingDeity, name_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="e.g. Lord Hanuman"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Name in Hindi *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDeity.name_hi || ''}
                    onChange={(e) => setEditingDeity({ ...editingDeity, name_hi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="e.g. श्री हनुमान जी"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Significance & Spiritual Subtitle
                </label>
                <textarea
                  rows={2}
                  value={editingDeity.significance || ''}
                  onChange={(e) => setEditingDeity({ ...editingDeity, significance: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="e.g. Destroyer of fear and obstacles, provider of courage and devotion"
                />
              </div>

              {/* Image Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Deity Image (Supabase Storage: deity-images bucket)
                </label>
                <div className="flex items-center gap-4 p-3 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/50">
                  {editingDeity.image_url ? (
                    <div className="relative group flex-shrink-0">
                      <img
                        src={editingDeity.image_url}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingDeity({ ...editingDeity, image_url: null })}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-stone-200 flex items-center justify-center text-stone-400 flex-shrink-0">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-sm">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                          <span>Uploading image...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-orange-600" />
                          <span>Choose image & upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                        disabled={uploadingImage}
                      />
                    </label>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Supports JPG, PNG, WebP (Square 512x512 recommended)
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Order & Popular Switch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Home Carousel Order
                  </label>
                  <input
                    type="number"
                    value={editingDeity.display_order ?? 1}
                    onChange={(e) => setEditingDeity({ ...editingDeity, display_order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="deityPop"
                    checked={editingDeity.is_popular ?? false}
                    onChange={(e) => setEditingDeity({ ...editingDeity, is_popular: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                  />
                  <label htmlFor="deityPop" className="text-sm font-medium text-stone-800">
                    Mark as Popular (Home Carousel)
                  </label>
                </div>
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
                  disabled={isSubmitting || uploadingImage}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Deity
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
              Are you sure you want to permanently delete <span className="font-bold text-stone-900">"{deleteName}"</span>?
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
