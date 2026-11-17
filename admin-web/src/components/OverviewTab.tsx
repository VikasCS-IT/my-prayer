import React from 'react';
import { Globe2, Sparkles, BookOpen, Users, ArrowUpRight } from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface OverviewTabProps {
  counts: {
    religionsCount: number;
    deitiesCount: number;
    prayersCount: number;
    usersCount: number;
  };
  onNavigateTab: (tab: AdminTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ counts, onNavigateTab }) => {
  const cards = [
    {
      title: 'Registered Users',
      count: counts.usersCount,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      tab: 'overview' as AdminTab,
      description: 'Total registered user accounts & devotee profiles',
    },
    {
      title: 'Religions',
      count: counts.religionsCount,
      icon: Globe2,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      tab: 'religions' as AdminTab,
      description: 'Active religions and spiritual lineages',
    },
    {
      title: 'Deities',
      count: counts.deitiesCount,
      icon: Sparkles,
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      tab: 'deities' as AdminTab,
      description: 'Featured home carousel and deity profiles',
    },
    {
      title: 'Prayers & Chalisas',
      count: counts.prayersCount,
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      tab: 'prayers' as AdminTab,
      description: 'Sacred verses, meanings, and active audio tracks',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-2xl p-8 text-white shadow-xl shadow-orange-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
            Realtime Supabase Cloud Integration
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            My Prayer Central Administration Portal
          </h2>
          <p className="text-orange-100 text-sm leading-relaxed">
            Securely manage, update, and publish religions, deities, sacred chants, verse texts, audio tracks, and remote branding for the mobile application in real time.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 text-9xl opacity-15 select-none pointer-events-none">
          🕉️
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                  {card.tab !== 'overview' && (
                    <button
                      onClick={() => onNavigateTab(card.tab)}
                      className="text-stone-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                      title="Open Section"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  {card.title}
                </h3>
                <div className="text-3xl font-extrabold text-stone-900 mt-1 mb-2">
                  {card.count}
                </div>
                <p className="text-xs text-stone-500 leading-normal">
                  {card.description}
                </p>
              </div>

              {card.tab !== 'overview' && (
                <div className="pt-4 mt-4 border-t border-stone-100">
                  <button
                    onClick={() => onNavigateTab(card.tab)}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    Manage records &rarr;
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Action Highlights */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
        <h3 className="text-base font-bold text-stone-800 mb-4">
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigateTab('deities')}
            className="p-4 rounded-xl border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 text-left transition-all"
          >
            <p className="font-semibold text-sm text-stone-800">🌸 Add New Deity</p>
            <p className="text-xs text-stone-500 mt-1">Upload image, set significance and home screen order</p>
          </button>
          <button
            onClick={() => onNavigateTab('prayers')}
            className="p-4 rounded-xl border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 text-left transition-all"
          >
            <p className="font-semibold text-sm text-stone-800">📜 Upload Prayer & Audio</p>
            <p className="text-xs text-stone-500 mt-1">Upload .mp3 track and manage verse-by-verse lines</p>
          </button>
          <button
            onClick={() => onNavigateTab('branding')}
            className="p-4 rounded-xl border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 text-left transition-all"
          >
            <p className="font-semibold text-sm text-stone-800">⚙️ Remote App Branding</p>
            <p className="text-xs text-stone-500 mt-1">Update app icon, splash screen, and title remotely</p>
          </button>
        </div>
      </div>
    </div>
  );
};
