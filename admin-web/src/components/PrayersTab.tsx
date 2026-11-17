import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Music,
  BookOpen,
  UploadCloud,
  Check,
  X,
  Loader2,
  Play,
  Pause,
  ListPlus,
} from 'lucide-react';
import { DbPrayer, DbDeity, DbVerse } from '../types';
import {
  apiGetPrayerWithVerses,
  apiCreatePrayer,
  apiUpdatePrayer,
  apiDeletePrayer,
  apiSaveVerses,
  apiUploadFile,
} from '../lib/api-client';

interface PrayersTabProps {
  prayers: (DbPrayer & { deity?: DbDeity; verses_count?: number })[];
  deities: DbDeity[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export const PrayersTab: React.FC<PrayersTabProps> = ({
  prayers,
  deities,
  onRefresh,
  showToast,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<Partial<DbPrayer> | null>(null);
  const [prayerVerses, setPrayerVerses] = useState<Omit<DbVerse, 'id' | 'prayer_id'>[]>([]);

  // New Verse form fields inside modal
  const [newTextHi, setNewTextHi] = useState('');
  const [newTextEn, setNewTextEn] = useState('');
  const [newMeaningEn, setNewMeaningEn] = useState('');
  const [newVerseType, setNewVerseType] = useState('chaupai');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Audio preview playback
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingPrayer({
      deity_id: deities[0]?.id || '',
      category: 'chalisa',
      title_en: '',
      title_hi: '',
      duration_seconds: 480,
      audio_url: null,
      is_featured: false,
    });
    setPrayerVerses([]);
    setModalOpen(true);
  };

  const handleOpenEdit = async (p: DbPrayer) => {
    setEditingPrayer({ ...p });
    try {
      const { verses } = await apiGetPrayerWithVerses(p.id);
      setPrayerVerses(
        verses.map((v) => ({
          verse_number: v.verse_number,
          text_hi: v.text_hi,
          text_en: v.text_en || null,
          meaning_en: v.meaning_en || null,
          verse_type: v.verse_type || 'chaupai',
        }))
      );
    } catch {
      setPrayerVerses([]);
    }
    setModalOpen(true);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validation: MP3 / Audio
    if (!file.type.includes('audio') && !file.name.endsWith('.mp3')) {
      showToast('error', 'Please select a valid .mp3 audio file.');
      return;
    }

    setUploadingAudio(true);
    try {
      // Upload via API
      const publicUrl = await apiUploadFile('prayer-audio', file);
      setEditingPrayer((prev) => ({ ...prev, audio_url: publicUrl }));
      showToast('success', 'Audio file (.mp3) uploaded successfully via API!');
    } catch (err: any) {
      showToast('error', err.message || 'Audio upload failed');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleAddVerse = () => {
    if (!newTextHi.trim()) {
      showToast('error', 'Please enter Hindi line for the chaupai / doha / verse.');
      return;
    }

    setPrayerVerses((prev) => [
      ...prev,
      {
        verse_number: prev.length + 1,
        text_hi: newTextHi.trim(),
        text_en: newTextEn.trim() || null,
        meaning_en: newMeaningEn.trim() || null,
        verse_type: newVerseType,
      },
    ]);

    setNewTextHi('');
    setNewTextEn('');
    setNewMeaningEn('');
  };

  const handleRemoveVerse = (index: number) => {
    setPrayerVerses((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrayer?.title_en || !editingPrayer?.title_hi || !editingPrayer?.deity_id) {
      showToast('error', 'Title (English and Hindi) and associated deity are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<DbPrayer, 'id'> = {
        deity_id: editingPrayer.deity_id,
        category: (editingPrayer.category as any) || 'chalisa',
        title_en: editingPrayer.title_en,
        title_hi: editingPrayer.title_hi,
        subtitle_hi: editingPrayer.subtitle_hi || null,
        subtitle_en: editingPrayer.subtitle_en || null,
        audio_url: editingPrayer.audio_url || null,
        duration_seconds: Number(editingPrayer.duration_seconds) || 480,
        is_featured: Boolean(editingPrayer.is_featured),
        significance: editingPrayer.significance || null,
      };

      if (editingPrayer.id) {
        await apiUpdatePrayer(editingPrayer.id, payload);
        await apiSaveVerses(editingPrayer.id, prayerVerses);
        showToast('success', 'Prayer and verses updated successfully via API!');
      } else {
        await apiCreatePrayer(payload, prayerVerses);
        showToast('success', 'New prayer and verse collection created successfully!');
      }

      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save prayer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiDeletePrayer(deleteId);
      showToast('success', `"${deleteTitle}" deleted successfully.`);
      setDeleteId(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete prayer');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePlayAudio = (url: string) => {
    if (playingAudioUrl === url && audioElement) {
      audioElement.pause();
      setPlayingAudioUrl(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setPlayingAudioUrl(null);
    setAudioElement(audio);
    setPlayingAudioUrl(url);
  };

  const filteredPrayers = prayers.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            Prayers & Audio Manager
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Manage Chalisas, Aartis, Kathas, verse-by-verse transliterations, and .mp3 audio streams
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm shadow-orange-950/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prayer</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Categories' },
          { id: 'chalisa', label: 'Chalisa' },
          { id: 'aarti', label: 'Aarti' },
          { id: 'katha', label: 'Vrat Katha' },
          { id: 'mantra', label: 'Mantra' },
          { id: 'stotra', label: 'Stotra' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              categoryFilter === tab.id
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Associated Deity</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Verses Count</th>
                <th className="px-6 py-4">Audio Stream</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPrayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                    No prayers found matching this category.
                  </td>
                </tr>
              ) : (
                filteredPrayers.map((p) => {
                  const deity = deities.find((d) => d.id === p.deity_id);
                  const isAudioPlaying = playingAudioUrl === p.audio_url;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-stone-900">{p.title_en}</div>
                        <div className="text-xs text-stone-400">{p.title_hi}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-stone-800">
                        {deity?.name_en || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-600 font-medium">
                        {p.verses_count || 0} lines
                      </td>
                      <td className="px-6 py-4">
                        {p.audio_url ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTogglePlayAudio(p.audio_url!)}
                              className="p-1.5 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                              title={isAudioPlaying ? 'Pause' : 'Play'}
                            >
                              {isAudioPlaying ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>
                            <span className="text-xs text-emerald-700 font-medium">
                              .mp3 active
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 italic">
                            Local synthesizer fallback
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-stone-400 hover:text-orange-600 rounded-lg hover:bg-stone-100 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(p.id);
                            setDeleteTitle(p.title_en);
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRAYER & VERSES MODAL */}
      {modalOpen && editingPrayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 my-8 max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
              {editingPrayer.id ? 'Edit Prayer & Verses' : 'Add New Prayer & Verses'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1">
              {/* Titles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPrayer.title_en || ''}
                    onChange={(e) => setEditingPrayer({ ...editingPrayer, title_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="e.g. Shri Hanuman Chalisa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Title (Hindi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPrayer.title_hi || ''}
                    onChange={(e) => setEditingPrayer({ ...editingPrayer, title_hi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="e.g. श्री हनुमान चालीसा"
                  />
                </div>
              </div>

              {/* Deity & Category Select */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Associated Deity *
                  </label>
                  <select
                    value={editingPrayer.deity_id || ''}
                    onChange={(e) => setEditingPrayer({ ...editingPrayer, deity_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                  >
                    {deities.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name_en} ({d.name_hi})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editingPrayer.category || 'chalisa'}
                    onChange={(e) => setEditingPrayer({ ...editingPrayer, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white uppercase font-medium"
                  >
                    <option value="chalisa">Chalisa</option>
                    <option value="aarti">Aarti</option>
                    <option value="katha">Vrat Katha</option>
                    <option value="mantra">Mantra</option>
                    <option value="stotra">Stotra</option>
                  </select>
                </div>
              </div>

              {/* Audio Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Audio File (.mp3 Storage: prayer-audio bucket)
                </label>
                <div className="flex items-center gap-4 p-3 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/50">
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-sm">
                      {uploadingAudio ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                          <span>Uploading audio...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-orange-600" />
                          <span>Choose .mp3 file & upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="audio/*,.mp3"
                        className="hidden"
                        onChange={handleAudioUpload}
                        disabled={uploadingAudio}
                      />
                    </label>
                    {editingPrayer.audio_url && (
                      <p className="text-xs text-emerald-700 font-medium mt-1 truncate">
                        ✓ Connected: {editingPrayer.audio_url}
                      </p>
                    )}
                  </div>
                  {editingPrayer.audio_url && (
                    <button
                      type="button"
                      onClick={() => setEditingPrayer({ ...editingPrayer, audio_url: null })}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove Audio
                    </button>
                  )}
                </div>
              </div>

              {/* Verse-by-Verse Content Manager */}
              <div className="pt-3 border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                    Verses & Lines Management ({prayerVerses.length} verses)
                  </h4>
                </div>

                {/* List of existing verses */}
                <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-200 mb-3 bg-stone-50/30">
                  {prayerVerses.map((v, idx) => (
                    <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-orange-700">#{idx + 1} ({v.verse_type})</span>
                        <p className="font-semibold text-stone-900 mt-0.5">{v.text_hi}</p>
                        {v.meaning_en && <p className="text-stone-500 italic mt-0.5">{v.meaning_en}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVerse(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Verse Inputs */}
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                  <input
                    type="text"
                    value={newTextHi}
                    onChange={(e) => setNewTextHi(e.target.value)}
                    placeholder="New Chaupai or Verse Line in Hindi *"
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-orange-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newTextEn}
                      onChange={(e) => setNewTextEn(e.target.value)}
                      placeholder="English Transliteration (optional)"
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      value={newMeaningEn}
                      onChange={(e) => setNewMeaningEn(e.target.value)}
                      placeholder="English Meaning / Translation (optional)"
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVerse}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 text-white text-xs font-semibold hover:bg-stone-900"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>Add Verse Line</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  disabled={isSubmitting || uploadingAudio}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Prayer & Verses
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
              Are you sure you want to permanently delete <span className="font-bold text-stone-900">"{deleteTitle}"</span>? All associated verses will also be removed.
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
