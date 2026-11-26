import React, { useState } from 'react';
import { useApp, LiveChannelAuditPayload } from '../../context/AppContext';
import { analyzeInfluencerAuthenticity } from '../../utils/fraudDetection';
import { AuthenticityReport } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Info,
  CheckCircle2,
  Youtube,
  UserPlus,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface FraudDetectorToolProps {
  initialHandle?: string;
}

interface LiveAuditResponse extends LiveChannelAuditPayload {
  totalViews: number;
  videoCount: number;
  avgLikes: number;
  avgComments: number;
  viewToSubRatio: number;
  quotaUsedEstimate: number;
  recentVideos: {
    id: string;
    title: string;
    publishedAt: string;
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    thumbnail: string;
  }[];
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export const FraudDetectorTool: React.FC<FraudDetectorToolProps> = ({ initialHandle }) => {
  const { creators, setShowMethodologyModal, importLiveYouTubeCreator } = useApp();

  // Live YouTube Data API v3 Audit State
  const [liveQuery, setLiveQuery] = useState<string>('@TechnicalGuruji');
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveAudit, setLiveAudit] = useState<LiveAuditResponse | null>(null);
  const [importedMsg, setImportedMsg] = useState<string | null>(null);

  // Manual Heuristic Simulator State
  const [inputHandle, setInputHandle] = useState<string>(initialHandle || '@ViralMegaGrowth');
  const [subscribers, setSubscribers] = useState<number>(890000);
  const [avgLikes, setAvgLikes] = useState<number>(3100);
  const [avgComments, setAvgComments] = useState<number>(85);
  const [growthType, setGrowthType] = useState<'organic' | 'spike' | 'erratic'>('spike');

  const [report, setReport] = useState<AuthenticityReport>(() => {
    const match = creators.find(c => c.handle.toLowerCase() === (initialHandle || '@ViralMegaGrowth').toLowerCase());
    if (match) return match.authenticityReport;
    return analyzeInfluencerAuthenticity('@ViralMegaGrowth', 890000, 3100, 85, 'spike');
  });

  const runLiveYouTubeAudit = async (queryOverride?: string) => {
    const target = (queryOverride ?? liveQuery).trim();
    if (!target) return;
    setLiveQuery(target);
    setLiveLoading(true);
    setLiveError(null);
    setImportedMsg(null);

    try {
      const res = await fetch(`/api/youtube/channel?handle=${encodeURIComponent(target)}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch live YouTube channel');
      }
      setLiveAudit(json);
      // Sync report display with live audit too
      setInputHandle(json.handle);
      setSubscribers(json.subscribers);
      setAvgLikes(json.avgLikes);
      setAvgComments(json.avgComments);
      setReport(json.authenticityReport);
    } catch (err: any) {
      setLiveError(err?.message || 'Unable to audit YouTube channel');
    } finally {
      setLiveLoading(false);
    }
  };

  const handleImportLiveCreator = () => {
    if (!liveAudit) return;
    importLiveYouTubeCreator(liveAudit);
    setImportedMsg(`${liveAudit.name} (${liveAudit.handle}) imported into Creator Recommendations!`);
  };

  const handleSelectPreset = (creatorId: string) => {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return;

    setInputHandle(creator.handle);
    setSubscribers(creator.subscribers);
    setAvgLikes(Math.round((creator.avgViews * (creator.engagementRate / 100)) * 0.9));
    setAvgComments(Math.round((creator.avgViews * (creator.engagementRate / 100)) * 0.1));
    setGrowthType(creator.authenticityReport.growthCurveType === 'Abrupt Bot Spike' ? 'spike' : 'organic');
    setReport(creator.authenticityReport);
  };

  const handleRunScan = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = creators.find(c => c.handle.toLowerCase() === inputHandle.toLowerCase());
    const res = analyzeInfluencerAuthenticity(
      inputHandle,
      Number(subscribers),
      Number(avgLikes),
      Number(avgComments),
      growthType,
      existing?.authenticityReport
    );
    setReport(res);
  };

  const isHighRisk = report.riskLevel === 'HIGH_RISK_SUSPICIOUS';
  const isModerate = report.riskLevel === 'MODERATE_CAUTION';

  return (
    <div className="space-y-6">
      {/* Overview Title Card */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Influencer Fraud & Live YouTube Channel Forensic Auditor</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Live YouTube API Audit & Bot Follower Anomaly Detector
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Pull real channel statistics and the last 10 uploads via YouTube Data API v3 to verify authentic engagement before locking escrow.
          </p>
        </div>

        <button
          onClick={() => setShowMethodologyModal(true)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 px-3 py-2 border border-indigo-200 bg-indigo-50/50 rounded-lg cursor-pointer shrink-0"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Audit Heuristics Documentation</span>
        </button>
      </div>

      {/* LIVE YOUTUBE API AUDITOR */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-600" />
              Live YouTube Data API v3 Channel Lookup
            </h3>
            <p className="text-xs text-slate-500">
              Enter any real YouTube <code>@handle</code>, channel URL, or channel name (examples from your Kaggle India dataset below):
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {['@TechnicalGuruji', '@ProBoiz95', '@MKBHD', '@SATVIK', '@YogiBoltaHai'].map(sample => (
            <button
              key={sample}
              type="button"
              onClick={() => runLiveYouTubeAudit(sample)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono cursor-pointer transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            runLiveYouTubeAudit();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            placeholder="e.g. @TechnicalGuruji, https://youtube.com/@MKBHD, or channel name..."
            value={liveQuery}
            onChange={e => setLiveQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={liveLoading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {liveLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{liveLoading ? 'Auditing Live API...' : 'Audit Live Channel'}</span>
          </button>
        </form>

        {liveError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <strong>YouTube API Error:</strong> {liveError}
          </div>
        )}

        {liveAudit && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={liveAudit.avatar}
                  alt={liveAudit.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{liveAudit.name}</h4>
                    <span className="text-xs font-mono text-slate-500">{liveAudit.handle}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                    <span>{liveAudit.inferredNiche}</span>
                    <span>·</span>
                    <span>Region: {liveAudit.country}</span>
                    <span>·</span>
                    <a
                      href={liveAudit.channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      Open Channel <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleImportLiveCreator}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Import to Recommendations</span>
              </button>
            </div>

            {importedMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium">
                {importedMsg}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Subscribers</span>
                <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                  {formatCompact(liveAudit.subscribers)}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Avg Views (10 vids)</span>
                <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                  {formatCompact(liveAudit.avgViews)}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Live Eng. Rate</span>
                <span className="font-mono font-bold text-indigo-600 text-sm tabular-nums">
                  {liveAudit.engagementRate}%
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">View / Sub Ratio</span>
                <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                  {liveAudit.viewToSubRatio}%
                </span>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Suggested 60s Rate</span>
                <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums">
                  ₹{liveAudit.suggestedRatesInr.integrated60s.toLocaleString()}
                </span>
              </div>
            </div>

            {liveAudit.recentVideos.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Latest Audited Uploads ({liveAudit.recentVideos.length} videos fetched via API)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {liveAudit.recentVideos.slice(0, 4).map(v => (
                    <a
                      key={v.id}
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white border border-slate-200 rounded flex items-center justify-between gap-2 text-[11px] hover:border-slate-300"
                    >
                      <span className="truncate font-medium text-slate-800">{v.title}</span>
                      <span className="font-mono text-slate-500 shrink-0 tabular-nums">
                        {formatCompact(v.views)} · {v.engagementRate}%
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preset Quick-Test Buttons */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-700 block mb-2">
          Or Test Pre-Seeded Dataset Profiles (Including Synthetic Bot Flag Test):
        </span>
        <div className="flex flex-wrap gap-2">
          {creators.map(c => {
            const isTarget = c.handle.toLowerCase() === inputHandle.toLowerCase();
            const flagged = c.authenticityReport.riskLevel === 'HIGH_RISK_SUSPICIOUS';
            return (
              <button
                key={c.id}
                onClick={() => handleSelectPreset(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isTarget
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <span>{c.name}</span>
                <span className={`text-[10px] font-mono ${flagged ? 'text-rose-400' : 'text-slate-400'}`}>
                  ({c.handle})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Scan Input & Parameters */}
      <form onSubmit={handleRunScan} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="font-semibold text-slate-800 text-sm">
          Manual Heuristic Sensitivity Simulator
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Channel / Social Handle</label>
            <input
              type="text"
              required
              value={inputHandle}
              onChange={e => setInputHandle(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Total Followers</label>
            <input
              type="number"
              value={subscribers}
              onChange={e => setSubscribers(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Avg Likes per Post</label>
            <input
              type="number"
              value={avgLikes}
              onChange={e => setAvgLikes(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Avg Comments per Post</label>
            <input
              type="number"
              value={avgComments}
              onChange={e => setAvgComments(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Growth Pattern</label>
            <select
              value={growthType}
              onChange={e => setGrowthType(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="organic">Organic Continuous</option>
              <option value="spike">Abrupt Bot Spike</option>
              <option value="erratic">Gradual Viral</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Execute Heuristic Audit</span>
          </button>
        </div>
      </form>

      {/* Forensic Report Display */}
      <div className={`p-6 rounded-xl border bg-white shadow-xs space-y-6 ${
        isHighRisk ? 'border-rose-300' : isModerate ? 'border-amber-300' : 'border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">{inputHandle}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">Audited {report.scanDate}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Growth Model: <strong>{report.growthCurveType}</strong>
            </div>
          </div>

          <div>
            {isHighRisk ? (
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                HIGH RISK: Severe Bot Activity Detected
              </span>
            ) : isModerate ? (
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                MODERATE RISK: Engagement Caution
              </span>
            ) : (
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                VERIFIED AUTHENTIC: Genuine Audience
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Credibility Score</span>
            <div className={`font-mono text-2xl font-bold mt-1 tabular-nums ${
              report.credibilityScore >= 80 ? 'text-emerald-600' : report.credibilityScore >= 60 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {report.credibilityScore} / 100
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Overall Trustworthiness</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Estimated Fake Followers</span>
            <div className={`font-mono text-2xl font-bold mt-1 tabular-nums ${
              report.fakeFollowersEstimatePct > 20 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {report.fakeFollowersEstimatePct}%
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Automated or dormant bots</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Engagement Anomaly</span>
            <div className={`font-mono text-sm font-bold mt-2 ${
              report.engagementAnomaly === 'Normal' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {report.engagementAnomaly}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Tier vs actual velocity</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Spam Comment Flags</span>
            <div className={`font-mono text-2xl font-bold mt-1 tabular-nums ${
              report.botPatternCount > 50 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {report.botPatternCount}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Repetitive bot pod patterns</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Detailed Forensic Findings &amp; Diagnostic Log:
          </div>
          <div className="space-y-2">
            {report.auditFlags.map((flag, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                  isHighRisk ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                {isHighRisk ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
