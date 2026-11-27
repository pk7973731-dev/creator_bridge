import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  HelpCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { CampaignLauncher } from './CampaignLauncher';

interface BusinessDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenContract: (campaignId: string) => void;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  onNavigate,
  onOpenContract,
}) => {
  const {
    currentDealer,
    campaigns,
    contracts,
    creators,
    setShowMethodologyModal,
    setShowPersonaModal,
  } = useApp();

  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  const dealerCampaigns = campaigns.filter(c => c.dealerId === currentDealer.id);
  const dealerContracts = contracts.filter(c => c.dealerId === currentDealer.id);

  const totalEscrowLocked = dealerContracts
    .filter(c =>
      c.escrowStatus === 'SIGNED_BY_DEALER_PENDING_CREATOR' ||
      c.escrowStatus === 'ESCROW_FUNDED_ACTIVE' ||
      c.escrowStatus === 'DELIVERABLE_SUBMITTED' ||
      c.escrowStatus === 'DISPUTED'
    )
    .reduce((sum, c) => sum + c.feeAmount, 0);

  const verifiedCreatorsCount = creators.filter(
    c => c.authenticityReport.riskLevel === 'VERIFIED_SAFE'
  ).length;

  return (
    <div className="space-y-6">
      {/* Brand Hero Welcome Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={currentDealer.avatar}
            alt=""
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Business Dealer Portal
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{currentDealer.industry}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {currentDealer.companyName}
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
              {currentDealer.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {currentDealer.brandValues.map((val, i) => (
                <span
                  key={i}
                  className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setIsLauncherOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Product</span>
          </button>
          <button
            onClick={() => setShowPersonaModal(true)}
            className="w-full sm:w-auto px-3 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Switch Brand Account
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Active Products</span>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {dealerCampaigns.length}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Ready for creator matching</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Protected Escrow</span>
          <div className="font-mono text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            ₹{totalEscrowLocked.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Locked in active deals</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Audited Creators</span>
          <div className="font-mono text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
            {verifiedCreatorsCount}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Forensically bot-cleared</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Agreements</span>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {dealerContracts.length}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Digitally signed contracts</span>
        </div>
      </div>

      {/* Quick Action Portals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('recommendations')}
          className="p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <Sparkles className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Creator Recommendations</h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse influencers ranked by our 5-pillar compatibility scoring engine tailored to your product.
          </p>
        </button>

        <button
          onClick={() => onNavigate('fraud-detection')}
          className="p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Bot & Fraud Scanner</h3>
          <p className="text-xs text-slate-500 mt-1">
            Heuristic audit tool checking follower spike anomalies, click-farm pods, and engagement authenticity.
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
          <h3 className="font-bold text-slate-900 text-sm">Contracts & Escrow Vault</h3>
          <p className="text-xs text-slate-500 mt-1">
            Access previous agreements, review submitted deliverable proof videos, and release escrow payouts.
          </p>
        </button>
      </div>

      {/* Active Campaigns List */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Active Product Campaigns</h3>
            <p className="text-xs text-slate-500">Products currently matched with creators</p>
          </div>
          <button
            onClick={() => setIsLauncherOpen(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Another</span>
          </button>
        </div>

        <div className="space-y-3">
          {dealerCampaigns.map(camp => (
            <div
              key={camp.id}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{camp.productName}</span>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {camp.productCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 max-w-xl">{camp.productTagline}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span>Deliverable: <strong>{camp.deliverableNeeded}</strong></span>
                  <span>·</span>
                  <span>Escrow Budget: <strong className="font-mono text-slate-900">₹{camp.budget.toLocaleString()}</strong></span>
                  <span>·</span>
                  <span>Deadline: <strong>{camp.deadline}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('recommendations')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md text-xs cursor-pointer transition-colors"
                >
                  Find Matched Creators
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CampaignLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
      />
    </div>
  );
};
