import React, { useState, useMemo } from 'react';
import { useApp, LiveChannelAuditPayload } from '../../context/AppContext';
import { CreatorProfile, RecommendationBreakdown } from '../../types';
import { calculateCreatorRecommendation } from '../../utils/recommendationEngine';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Plus,
  Send,
  Eye,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  FileText,
  Search,
  X,
  Youtube,
  Loader2,
  UserPlus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DigitalContractModal } from '../contracts/DigitalContractModal';
import { CampaignLauncher } from './CampaignLauncher';

interface LiveSearchCandidate {
  channelId: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  country: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  inferredNiche: CreatorProfile['niche'];
  estimatedIntegratedRateInr: number;
}

interface CreatorRecommendationsProps {
  onNavigateToFraudScan: (handle: string) => void;
  onNavigateToContracts: () => void;
}

export const CreatorRecommendations: React.FC<CreatorRecommendationsProps> = ({
  onNavigateToFraudScan,
  onNavigateToContracts,
}) => {
  const {
    creators,
    campaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    initiateConnection,
    setShowMethodologyModal,
    importLiveYouTubeCreator,
  } = useApp();

  const [nicheFilter, setNicheFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingBreakdown, setInspectingBreakdown] = useState<{
    creator: CreatorProfile;
    breakdown: RecommendationBreakdown;
  } | null>(null);

  const [contractModalData, setContractModalData] = useState<{
    isOpen: boolean;
    creator?: CreatorProfile;
  }>({ isOpen: false });

  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  // Live YouTube Data API v3 Search & Import state
  const [ytQuery, setYtQuery] = useState<string>('');
  const [ytSearching, setYtSearching] = useState<boolean>(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytResults, setYtResults] = useState<LiveSearchCandidate[]>([]);
  const [importingChannelId, setImportingChannelId] = useState<string | null>(null);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  const handleLiveYouTubeSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (customQuery ?? ytQuery).trim();
    if (!q) return;
    if (customQuery) setYtQuery(customQuery);

    setYtSearching(true);
    setYtError(null);
    setImportedNotice(null);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}&region=IN`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `YouTube search failed (${res.status})`);
      }
      setYtResults(Array.isArray(data.channels) ? data.channels : []);
      if (!data.channels || data.channels.length === 0) {
        setYtError(`No public YouTube channels found for "${q}".`);
      }
    } catch (err: any) {
      setYtError(err?.message || 'Unable to query YouTube Data API v3.');
      setYtResults([]);
    } finally {
      setYtSearching(false);
    }
  };

  const handleAuditAndAdd = async (candidate: LiveSearchCandidate) => {
    setImportingChannelId(candidate.channelId);
    setYtError(null);
    setImportedNotice(null);
    try {
      const res = await fetch(`/api/youtube/channel?handle=${encodeURIComponent(candidate.channelId)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Channel audit failed.');
      }
      importLiveYouTubeCreator(data as LiveChannelAuditPayload);
      setImportedNotice(`Audited & ranked ${data.name} (${data.handle}) in your campaign match list.`);
    } catch (err: any) {
      setYtError(err?.message || 'Could not audit selected channel.');
    } finally {
      setImportingChannelId(null);
    }
  };

  const activeCampaign = useMemo(() => {
    return campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];
  }, [campaigns, selectedCampaignId]);

  // Compute recommendation scores for all creators
  const scoredCreators = useMemo(() => {
    if (!activeCampaign) return [];

    return creators.map(creator => {
      const breakdown = calculateCreatorRecommendation(creator, activeCampaign);
      return {
        creator,
        breakdown,
      };
    }).sort((a, b) => b.breakdown.overallScore - a.breakdown.overallScore);
  }, [creators, activeCampaign]);

  // Apply filters
  const filteredCreators = useMemo(() => {
    return scoredCreators.filter(({ creator }) => {
      if (nicheFilter !== 'All' && !creator.niche.includes(nicheFilter)) return false;
      if (riskFilter === 'SafeOnly' && creator.authenticityReport.riskLevel !== 'VERIFIED_SAFE') return false;
      if (riskFilter === 'FlaggedOnly' && creator.authenticityReport.riskLevel === 'VERIFIED_SAFE') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = creator.name.toLowerCase().includes(q) || creator.handle.toLowerCase().includes(q);
        const matchesNiche = creator.niche.toLowerCase().includes(q) || creator.subNiches.some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesNiche) return false;
      }
      return true;
    });
  }, [scoredCreators, nicheFilter, riskFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Active Campaign Context */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Active Launch Target
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{activeCampaign?.productCategory}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            {activeCampaign?.productName}
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            {activeCampaign?.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
            <span>
              Budget: <strong className="font-mono text-slate-900">₹{activeCampaign?.budget.toLocaleString()}</strong>
            </span>
            <span>·</span>
            <span>
              Format: <strong className="text-slate-900">{activeCampaign?.deliverableNeeded}</strong>
            </span>
            <span>·</span>
            <span>
              Deadline: <strong className="text-slate-900">{activeCampaign?.deadline}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedCampaignId}
            onChange={e => setSelectedCampaignId(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                Campaign: {c.productName}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsLauncherOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Product</span>
          </button>
        </div>
      </div>

      {/* Live YouTube Creator Discovery (YouTube Data API v3) */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Youtube className="w-4 h-4 text-rose-600" />
              <span>Discover &amp; Rank Real YouTube Creators (Live API)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Search live Indian YouTube channels by niche or keyword, run real-time fraud &amp; engagement auditing, and score them against {activeCampaign?.productName}.
            </p>
          </div>

          <form onSubmit={e => handleLiveYouTubeSearch(e)} className="flex items-center gap-2 w-full lg:w-auto">
            <input
              type="text"
              placeholder="e.g. Indian tech unboxing, BGMI gaming, skincare..."
              value={ytQuery}
              onChange={e => setYtQuery(e.target.value)}
              className="flex-1 lg:w-72 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={ytSearching || !ytQuery.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {ytSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{ytSearching ? 'Searching...' : 'Find Live Creators'}</span>
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span>Quick Indian niche searches:</span>
          {['Tech Unboxing India', 'Indian Gaming Creator', 'Indian Skincare Review', 'Personal Finance India'].map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => handleLiveYouTubeSearch(undefined, preset)}
              className="px-2 py-0.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        {ytError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{ytError}</span>
          </div>
        )}

        {importedNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importedNotice}</span>
            </div>
            <button
              onClick={() => setImportedNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {ytResults.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Live YouTube Data API v3 results ({ytResults.length} channels)</span>
              <button
                onClick={() => setYtResults([])}
                className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Clear results
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {ytResults.map(ch => {
                const isAlreadyAdded = creators.some(
                  c => c.id === `yt_${ch.channelId}` || c.handle.toLowerCase() === ch.handle.toLowerCase()
                );
                const isImporting = importingChannelId === ch.channelId;
                return (
                  <div
                    key={ch.channelId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={ch.avatar || '/src/assets/images/creator_avatar_tech_1794494846107.jpg'}
                        alt={ch.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{ch.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{ch.handle}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="font-mono tabular-nums font-semibold text-slate-800">
                        {ch.subscribers >= 1000000
                          ? `${(ch.subscribers / 1000000).toFixed(2)}M`
                          : `${Math.round(ch.subscribers / 1000)}K`} subs
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono tabular-nums">
                        Est. ₹{ch.estimatedIntegratedRateInr.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={() => handleAuditAndAdd(ch)}
                      className={`w-full py-1.5 px-2 rounded text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        isAlreadyAdded
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isImporting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      <span>
                        {isImporting
                          ? 'Auditing...'
                          : isAlreadyAdded
                          ? 'Re-Audit & Sync'
                          : 'Audit & Add to Match List'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search creator name, niche, handle..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={nicheFilter}
            onChange={e => setNicheFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none"
          >
            <option value="All">All Niches</option>
            <option value="Tech">Tech & Gadgets</option>
            <option value="Beauty">Beauty & Skincare</option>
            <option value="Fitness">Fitness & Health</option>
            <option value="Finance">Finance & Crypto</option>
            <option value="Gaming">Gaming & Hardware</option>
          </select>

          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none"
          >
            <option value="All">All Risk Profiles</option>
            <option value="SafeOnly">Verified Authentic Only</option>
            <option value="FlaggedOnly">Flagged Bot Accounts</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Found {filteredCreators.length} matched creators</span>
          <button
            onClick={() => setShowMethodologyModal(true)}
            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            How scoring works
          </button>
        </div>
      </div>

      {/* Creator Recommendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCreators.map(({ creator, breakdown }) => {
          const isFlagged = creator.authenticityReport.riskLevel === 'HIGH_RISK_SUSPICIOUS';
          return (
            <div
              key={creator.id}
              className={`bg-white rounded-xl border flex flex-col justify-between transition-all shadow-xs hover:shadow-sm ${
                isFlagged ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
              }`}
            >
              <div className="p-5">
                {/* Header: Score & Risk Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                        breakdown.overallScore >= 85
                          ? 'bg-emerald-100 text-emerald-800'
                          : breakdown.overallScore >= 70
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {breakdown.overallScore}% MATCH
                    </span>
                    <button
                      onClick={() => setInspectingBreakdown({ creator, breakdown })}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                    >
                      Why?
                    </button>
                  </div>

                  {isFlagged ? (
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1 border border-rose-200">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      Bot Flagged
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-100">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>

                {/* Creator Profile Lockup */}
                <div className="flex items-center gap-3">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {creator.name}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono truncate">
                      {creator.handle}
                    </div>
                    <span className="text-[11px] text-indigo-600 font-medium block truncate">
                      {creator.niche}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                  {creator.bio}
                </p>

                {/* Quantitative Metrics Row */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="p-1.5 bg-slate-50 rounded">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Followers</span>
                    <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                      {(creator.subscribers / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Engagement</span>
                    <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                      {creator.engagementRate}%
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Est. Rate</span>
                    <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                      ₹{creator.rates.integrated60s}
                    </span>
                  </div>
                </div>

                {/* Match Verdict Subtext */}
                <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span className="truncate">Verdict: {breakdown.verdict}</span>
                  <span className="font-mono text-slate-400">{creator.platform}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigateToFraudScan(creator.handle)}
                  className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md bg-white hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                  title="Run bot follower audit"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audit</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      initiateConnection(creator.id, activeCampaign.id);
                      onNavigateToContracts();
                    }}
                    className="px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md bg-white hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3 text-slate-500" />
                    <span>Connect</span>
                  </button>

                  <button
                    onClick={() => setContractModalData({ isOpen: true, creator })}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Send Deal</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transparent Why Recommended Inspector Modal */}
      {inspectingBreakdown && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Recommendation Algorithm Transparency
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Match Breakdown: {inspectingBreakdown.creator.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectingBreakdown(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Total Calculated Compatibility:</span>
                <span className="font-mono text-base font-bold text-indigo-600">
                  {inspectingBreakdown.breakdown.overallScore} / 100
                </span>
              </div>

              {/* 5 Components */}
              <div className="space-y-2">
                <div className="p-2.5 border border-slate-200 rounded">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>1. Niche & Category Alignment</span>
                    <span className="font-mono text-indigo-600">
                      {inspectingBreakdown.breakdown.nicheMatch.score} / {inspectingBreakdown.breakdown.nicheMatch.max} pts
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {inspectingBreakdown.breakdown.nicheMatch.reason}
                  </p>
                </div>

                <div className="p-2.5 border border-slate-200 rounded">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>2. Engagement Health & Authenticity</span>
                    <span className="font-mono text-indigo-600">
                      {inspectingBreakdown.breakdown.engagementHealth.score} / {inspectingBreakdown.breakdown.engagementHealth.max} pts
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {inspectingBreakdown.breakdown.engagementHealth.reason}
                  </p>
                </div>

                <div className="p-2.5 border border-slate-200 rounded">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>3. Budget & Rate Compatibility</span>
                    <span className="font-mono text-indigo-600">
                      {inspectingBreakdown.breakdown.budgetFit.score} / {inspectingBreakdown.breakdown.budgetFit.max} pts
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {inspectingBreakdown.breakdown.budgetFit.reason}
                  </p>
                </div>

                <div className="p-2.5 border border-slate-200 rounded">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>4. Demographic & Geo Overlap</span>
                    <span className="font-mono text-indigo-600">
                      {inspectingBreakdown.breakdown.audienceOverlap.score} / {inspectingBreakdown.breakdown.audienceOverlap.max} pts
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {inspectingBreakdown.breakdown.audienceOverlap.reason}
                  </p>
                </div>

                <div className="p-2.5 border border-slate-200 rounded">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>5. Past Dealer Satisfaction</span>
                    <span className="font-mono text-indigo-600">
                      {inspectingBreakdown.breakdown.dealerReputation.score} / {inspectingBreakdown.breakdown.dealerReputation.max} pts
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {inspectingBreakdown.breakdown.dealerReputation.reason}
                  </p>
                </div>
              </div>

              {inspectingBreakdown.breakdown.fraudPenaltyApplied && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                  <strong>Bot Detection Deduction:</strong> {inspectingBreakdown.breakdown.penaltyReason}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectingBreakdown(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Builder Modal */}
      <DigitalContractModal
        isOpen={contractModalData.isOpen}
        onClose={() => setContractModalData({ isOpen: false })}
        creator={contractModalData.creator}
        campaign={activeCampaign}
        mode="create"
      />

      {/* Campaign Launcher Modal */}
      <CampaignLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
      />
    </div>
  );
};
