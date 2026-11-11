import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Camera,
  Utensils,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Menu,
  X,
  ChevronRight,
  LogOut
} from 'lucide-react';
import CrownLogo from '../assets/Logo';
import { useApp } from '../hooks/useApp';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'routine', label: 'My Routine', shortLabel: 'Routine', icon: CheckSquare },
  { id: 'scanner', label: 'AI Food Scanner', shortLabel: 'AI Scan', icon: Camera },
  { id: 'diary', label: 'Food Diary', shortLabel: 'Diary', icon: Utensils },
  { id: 'history', label: 'History', shortLabel: 'History', icon: Calendar },
  { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings }
];

const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

export default function Navbar({ onOpenOutsideFoodModal }) {
  const { activeTab, setActiveTab, user, signOutUser } = useApp();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeNavObj = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-crown-border safe-top">
        <div className="max-w-6xl mx-auto lg:pl-64 px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1.5 rounded-xl text-crown-navy hover:bg-crown-input active:bg-slate-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none min-w-0"
            >
              <CrownLogo size={32} className="shrink-0" />
              <div className="truncate">
                <div className="text-sm font-extrabold tracking-tight text-crown-navy leading-none whitespace-nowrap">
                  CROWN HABIT
                </div>
                <div className="text-[10px] font-medium text-crown-muted mt-0.5 whitespace-nowrap">
                  {activeNavObj.label}
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-crown-blue hover:bg-blue-100 transition-colors whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Meal</span>
            </button>

            <button
              type="button"
              onClick={onOpenOutsideFoodModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-crown-navy text-white hover:opacity-95 transition-opacity whitespace-nowrap shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Outside Food</span>
            </button>
          </div>
        </div>
      </header>

      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-crown-navy/50 backdrop-blur-xs transition-opacity"
          />

          <aside className="relative w-72 max-w-[82vw] bg-crown-navy text-white h-full flex flex-col justify-between z-10 shadow-2xl">
            <div>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CrownLogo size={34} />
                  <div>
                    <div className="text-sm font-bold tracking-tight text-white leading-none">
                      CROWN HABIT
                    </div>
                    <div className="text-[9px] font-semibold tracking-widest text-slate-300 mt-1">
                      RESET. TRACK. IMPROVE.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="text-xs font-bold text-white truncate">
                    {user.displayName || 'Crown User'}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">{user.email}</div>
                </div>
              )}

              <div className="p-3 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Navigation
                </div>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-crown-blue text-white shadow-xs'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 space-y-2 safe-bottom">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onOpenOutsideFoodModal();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-crown-teal hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                + Add Outside Food
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    signOutUser();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-crown-navy text-white z-40">
        <div className="h-14 px-5 border-b border-white/10 flex items-center gap-3">
          <CrownLogo size={32} />
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white leading-none">
              CROWN HABIT
            </div>
            <div className="text-[9px] font-semibold tracking-widest text-slate-300 mt-1">
              RESET. TRACK. IMPROVE.
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-crown-blue text-white shadow-xs'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={onOpenOutsideFoodModal}
            className="w-full py-2.5 px-3 rounded-xl bg-crown-teal hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            + Add Outside Food
          </button>
        </div>
      </aside>

      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-crown-border safe-bottom shadow-elevated"
      >
        <div className="grid grid-cols-4 max-w-md mx-auto px-2 pt-1.5 pb-1">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-crown-blue font-bold'
                    : 'text-crown-muted hover:text-crown-navy font-medium'
                }`}
              >
                <div
                  className={`px-3.5 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-blue-50 text-crown-blue' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-0.5 leading-tight whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
