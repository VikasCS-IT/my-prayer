import React from 'react';
import {
  LayoutDashboard,
  Globe2,
  Sparkles,
  BookOpen,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export type AdminTab = 'overview' | 'religions' | 'deities' | 'prayers' | 'branding';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  adminName: string;
  adminEmail: string;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  adminName,
  adminEmail,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'overview' as AdminTab,
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'religions' as AdminTab,
      label: 'Religions Manager',
      icon: Globe2,
    },
    {
      id: 'deities' as AdminTab,
      label: 'Deities Manager',
      icon: Sparkles,
    },
    {
      id: 'prayers' as AdminTab,
      label: 'Prayers & Audio Manager',
      icon: BookOpen,
    },
    {
      id: 'branding' as AdminTab,
      label: 'App Branding & Metadata',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-72 bg-stone-900 text-stone-200 flex flex-col h-screen border-r border-stone-800 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-stone-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-950 font-bold text-lg">
          🕉️
        </div>
        <div>
          <h1 className="font-bold text-base text-stone-100 tracking-tight leading-tight">
            My Prayer
          </h1>
          <p className="text-xs text-orange-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 inline" /> Admin Console
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-900 font-semibold'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin User Footer & Logout */}
      <div className="p-4 border-t border-stone-800 bg-stone-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="overflow-hidden pr-2">
            <p className="text-sm font-semibold text-stone-200 truncate">{adminName}</p>
            <p className="text-xs text-stone-400 truncate">{adminEmail}</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-900/60 text-orange-300 border border-orange-700/50">
            Admin
          </span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
