import React from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, Building2, HelpCircle, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const {
    authUser,
    logout,
    activeRole,
    setActiveRole,
    currentDealer,
    currentCreator,
    setShowMethodologyModal,
    setShowPersonaModal,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('overview')}
            className="text-left group flex items-center gap-2 cursor-pointer focus-visible:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
              CB
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              CreatorBridge
            </span>
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
              currentTab === 'overview' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
            }`}
          >
            {activeRole === 'business' ? 'Dealer Hub' : 'Creator Studio'}
          </button>

          {activeRole === 'business' ? (
            <>
              <button
                onClick={() => setCurrentTab('recommendations')}
                className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
                  currentTab === 'recommendations' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                }`}
              >
                Creator Recommendations
              </button>
              <button
                onClick={() => setCurrentTab('fraud-detection')}
                className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
                  currentTab === 'fraud-detection' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                }`}
              >
                Fraud & Bot Scanner
              </button>
              <button
                onClick={() => setCurrentTab('contracts')}
                className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
                  currentTab === 'contracts' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                }`}
              >
                Contracts & Escrow
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentTab('trending')}
                className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
                  currentTab === 'trending' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                }`}
              >
                Trending Topics
              </button>
              <button
                onClick={() => setCurrentTab('contracts')}
                className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
                  currentTab === 'contracts' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                }`}
              >
                Inbound Deals & Escrow
              </button>
              <button
                onClick={() => setCurrentTab('analytics')}
                className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
                  currentTab === 'analytics' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                }`}
              >
                Channel & YouTube Analyzer
              </button>
            </>
          )}

          <button
            onClick={() => setShowMethodologyModal(true)}
            className="flex items-center gap-1.5 whitespace-nowrap transition-colors text-slate-500 hover:text-indigo-600 cursor-pointer"
            title="Learn how CreatorBridge calculates recommendations and detects bot fraud"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Algorithm Guide</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action - Portal & Persona Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Role Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setActiveRole('business');
                setCurrentTab('overview');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeRole === 'business'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Business</span>
            </button>
            <button
              onClick={() => {
                setActiveRole('creator');
                setCurrentTab('overview');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeRole === 'creator'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Creator</span>
            </button>
          </div>

          {/* Active Profile Switcher Button */}
          <button
            onClick={() => setShowPersonaModal(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-medium text-slate-800 cursor-pointer"
            title={authUser?.email ? `Signed in as ${authUser.email}` : 'Switch active profile'}
          >
            <img
              src={activeRole === 'business' ? currentDealer.avatar : currentCreator.avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover border border-slate-300"
            />
            <span className="truncate max-w-[120px]">
              {activeRole === 'business' ? currentDealer.companyName : currentCreator.name}
            </span>
          </button>

          {authUser && (
            <button
              onClick={logout}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
              title={`Sign out (${authUser.email || 'Account'})`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
