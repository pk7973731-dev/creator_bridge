/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/auth/LoginScreen';
import { Navbar } from './components/Navbar';
import { MethodologyModal } from './components/MethodologyModal';
import { PersonaModal } from './components/auth/PersonaModal';

// Business Components
import { BusinessDashboard } from './components/business/BusinessDashboard';
import { CreatorRecommendations } from './components/business/CreatorRecommendations';
import { FraudDetectorTool } from './components/business/FraudDetectorTool';
import { BusinessContracts } from './components/business/BusinessContracts';

// Creator Components
import { CreatorDashboard } from './components/creator/CreatorDashboard';
import { TrendingTopicsView } from './components/creator/TrendingTopicsView';
import { CreatorContracts } from './components/creator/CreatorContracts';
import { CreatorChannelAnalytics } from './components/creator/CreatorChannelAnalytics';

import { HelpCircle, Sparkles, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    authUser,
    authLoading,
    needsOnboarding,
    activeRole,
    setShowMethodologyModal,
    setShowPersonaModal,
  } = useApp();

  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [fraudAuditHandle, setFraudAuditHandle] = useState<string>('@ViralMegaGrowth');

  const handleNavigateToFraud = (handle: string) => {
    setFraudAuditHandle(handle);
    setCurrentTab('fraud-detection');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Verifying CreatorBridge session...</span>
      </div>
    );
  }

  if (!authUser || needsOnboarding) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Account Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            CreatorBridge Workspace
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono truncate max-w-[220px]">
            {authUser.email}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPersonaModal(true)}
            className="text-white hover:text-indigo-300 underline font-medium cursor-pointer"
          >
            Switch Brand / Creator Profile
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => setShowMethodologyModal(true)}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Algorithm &amp; Escrow Guide</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Body Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeRole === 'business' ? (
          <>
            {currentTab === 'overview' && (
              <BusinessDashboard
                onNavigate={tab => setCurrentTab(tab)}
                onOpenContract={() => setCurrentTab('contracts')}
              />
            )}
            {currentTab === 'recommendations' && (
              <CreatorRecommendations
                onNavigateToFraudScan={handleNavigateToFraud}
                onNavigateToContracts={() => setCurrentTab('contracts')}
              />
            )}
            {currentTab === 'fraud-detection' && (
              <FraudDetectorTool initialHandle={fraudAuditHandle} />
            )}
            {currentTab === 'contracts' && <BusinessContracts />}
          </>
        ) : (
          <>
            {currentTab === 'overview' && (
              <CreatorDashboard onNavigate={tab => setCurrentTab(tab)} />
            )}
            {currentTab === 'trending' && <TrendingTopicsView />}
            {currentTab === 'contracts' && <CreatorContracts />}
            {currentTab === 'analytics' && <CreatorChannelAnalytics />}
          </>
        )}
      </main>

      {/* Persistent Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
              CB
            </div>
            <span className="font-semibold text-slate-800">CreatorBridge Hub</span>
            <span>·</span>
            <span>Business Dealer x Content Creator Secured Marketplace</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => setShowMethodologyModal(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Recommendation Scoring Matrix
            </button>
            <span>·</span>
            <button
              onClick={() => setShowMethodologyModal(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Bot Fraud Heuristics
            </button>
            <span>·</span>
            <button
              onClick={() => setShowMethodologyModal(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Digital Escrow Agreement Standard
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <MethodologyModal />
      <PersonaModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
