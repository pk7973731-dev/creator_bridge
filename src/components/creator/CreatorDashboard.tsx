import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Youtube,
  Clock,
  CheckCircle,
  Flame,
  Award,
} from 'lucide-react';

interface CreatorDashboardProps {
  onNavigate: (tab: string) => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ onNavigate }) => {
  const {
    currentCreator,
    contracts,
    connections,
    trendingTopics,
    setShowPersonaModal,
  } = useApp();

  const creatorContracts = contracts.filter(c => c.creatorId === currentCreator.id);
  const pendingActionContracts = creatorContracts.filter(
    c => !c.creatorSignature?.signed || c.escrowStatus === 'ESCROW_FUNDED_ACTIVE'
  );

  const totalEarned = creatorContracts
    .filter(c => c.escrowStatus === 'APPROVED_PAYOUT_RELEASED')
    .reduce((sum, c) => sum + c.feeAmount, 0);

  const totalInEscrow = creatorContracts
    .filter(c =>
      c.escrowStatus === 'SIGNED_BY_DEALER_PENDING_CREATOR' ||
      c.escrowStatus === 'ESCROW_FUNDED_ACTIVE' ||
      c.escrowStatus === 'DELIVERABLE_SUBMITTED' ||
      c.escrowStatus === 'DISPUTED'
    )
    .reduce((sum, c) => sum + c.feeAmount, 0);

  // Relevant trending topics for this creator's niche
  const relevantTopics = trendingTopics
    .filter(t => t.niche.toLowerCase().includes(currentCreator.niche.toLowerCase()))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Creator Profile Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={currentCreator.avatar}
            alt=""
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                <Youtube className="w-3 h-3 text-emerald-600" />
                Creator Studio Portal
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-500">{currentCreator.handle}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {currentCreator.name}
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
              {currentCreator.bio}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {currentCreator.niche}
              </span>
              {currentCreator.subNiches.map((sn, i) => (
                <span
                  key={i}
                  className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                >
                  {sn}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('contracts')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Review Inbound Deals ({pendingActionContracts.length})</span>
          </button>
          <button
            onClick={() => setShowPersonaModal(true)}
            className="w-full sm:w-auto px-3 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Switch Creator Account
          </button>
        </div>
      </div>

      {/* Action Required Banner if pending contracts exist */}
      {pendingActionContracts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-900 block">
                {pendingActionContracts.length} Sponsorship Deal(s) Require Your Action
              </span>
              <span className="text-amber-800">
                Brand dealers have deposited funds into escrow. Counter-sign or submit video URLs to get paid.
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('contracts')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md shrink-0 cursor-pointer transition-colors"
          >
            Open Deals Desk
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Audited Subscribers</span>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {currentCreator.subscribers.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">100% Organic Delivery</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Locked in Escrow</span>
          <div className="font-mono text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            ₹{totalInEscrow.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Awaiting deliverable submission</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Completed Payouts</span>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            ₹{totalEarned.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Lifetime platform earnings</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Credibility Score</span>
          <div className="font-mono text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
            {currentCreator.authenticityReport.credibilityScore} / 100
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Verified Authentic Creator</span>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('trending')}
          className="p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <Flame className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Trending Video Topics</h3>
          <p className="text-xs text-slate-500 mt-1">
            Discover viral search trends, video hooks, and commercial brand demand in your niche.
          </p>
        </button>

        <button
          onClick={() => onNavigate('contracts')}
          className="p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <FileText className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Inbound Brand Deals & Escrow</h3>
          <p className="text-xs text-slate-500 mt-1">
            Review sponsorship contracts, sign with digital signatures, and submit YouTube links for payout.
          </p>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <Youtube className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Channel & Rate Card Desk</h3>
          <p className="text-xs text-slate-500 mt-1">
            Audit YouTube statistics, manage pricing rate cards, and inspect Free YouTube API mechanics.
          </p>
        </button>
      </div>

      {/* Niche Trending Topics Spotlight */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Hot Trending Topics in {currentCreator.niche}
            </h3>
            <p className="text-xs text-slate-500">High search interest with high sponsor demand right now</p>
          </div>
          <button
            onClick={() => onNavigate('trending')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Trends</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {relevantTopics.map(topic => (
            <div
              key={topic.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                    {topic.growthPercentage}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{topic.searchVolume}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-1">{topic.topic}</h4>
                <p className="text-slate-600 text-[11px] mt-1 line-clamp-2 italic">
                  &quot;{topic.creatorAngle}&quot;
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Sponsor Fit:</span>
                <span className="font-semibold text-slate-800">{topic.commercialSponsorDemand}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
