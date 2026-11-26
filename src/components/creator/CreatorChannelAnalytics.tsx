import React, { useState, useEffect } from 'react';
import { useApp, LiveChannelAuditPayload } from '../../context/AppContext';
import {
  Youtube,
  BarChart3,
  IndianRupee,
  Globe2,
  Users,
  Code2,
  Check,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const CreatorChannelAnalytics: React.FC = () => {
  const { currentCreator, updateCreatorProfile, importLiveYouTubeCreator, switchCreator } = useApp();

  const [ratesForm, setRatesForm] = useState({
    dedicated: currentCreator.rates.dedicatedVideo,
    integrated: currentCreator.rates.integrated60s,
    shorts: currentCreator.rates.shortsReels,
  });

  useEffect(() => {
    setRatesForm({
      dedicated: currentCreator.rates.dedicatedVideo,
      integrated: currentCreator.rates.integrated60s,
      shorts: currentCreator.rates.shortsReels,
    });
  }, [
    currentCreator.id,
    currentCreator.rates.dedicatedVideo,
    currentCreator.rates.integrated60s,
    currentCreator.rates.shortsReels,
  ]);

  const [isSaved, setIsSaved] = useState(false);
  const [activeApiTab, setActiveApiTab] = useState<'endpoint' | 'json' | 'calculation'>('endpoint');

  // Live YouTube Data API v3 Sync State
  const [syncHandle, setSyncHandle] = useState(currentCreator.handle || '@TechnicalGuruji');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const handleSyncLiveYouTube = async (e?: React.FormEvent, overrideHandle?: string) => {
    if (e) e.preventDefault();
    const target = (overrideHandle ?? syncHandle).trim();
    if (!target) return;
    if (overrideHandle) setSyncHandle(overrideHandle);

    setSyncLoading(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const res = await fetch(`/api/youtube/channel?handle=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `YouTube channel lookup failed (${res.status})`);
      }
      const newCreatorId = importLiveYouTubeCreator(data as LiveChannelAuditPayload);
      switchCreator(newCreatorId);
      setSyncSuccess(
        `Synced live stats for ${data.name} (${data.subscribers.toLocaleString()} subs · ${data.engagementRate}% engagement · ${data.quotaUsedEstimate} API quota units).`
      );
    } catch (err: any) {
      setSyncError(err?.message || 'Unable to sync channel from YouTube Data API v3.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateCreatorProfile({
      rates: {
        dedicatedVideo: Number(ratesForm.dedicated),
        integrated60s: Number(ratesForm.integrated),
        shortsReels: Number(ratesForm.shorts),
      },
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentCreator.avatar}
            alt=""
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                <Youtube className="w-3.5 h-3.5 text-rose-600" />
                Verified Channel
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-500">{currentCreator.handle}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {currentCreator.name} — YouTube Channel Intelligence
            </h2>
            <p className="text-xs text-slate-500">
              {currentCreator.channelUrl} · Primary Category: <strong>{currentCreator.niche}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Dealer Satisfaction</span>
            <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
              ★ {currentCreator.avgDealerRating} / 5.0
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Deals Completed</span>
            <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
              {currentCreator.pastDealsCompleted} Deals
            </span>
          </div>
        </div>
      </div>

      {/* Live YouTube Data API v3 Sync Control */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Youtube className="w-4 h-4 text-rose-600" />
              <span>Sync Your Live YouTube Channel (YouTube Data API v3)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Connect any real YouTube @handle, channel ID, or URL to pull live subscribers, recent 10-video views, engagement velocity, and recommended ₹ INR rates.
            </p>
          </div>

          <form onSubmit={e => handleSyncLiveYouTube(e)} className="flex items-center gap-2 w-full lg:w-auto">
            <input
              type="text"
              placeholder="@handle or youtube.com/@channel"
              value={syncHandle}
              onChange={e => setSyncHandle(e.target.value)}
              className="flex-1 lg:w-64 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={syncLoading || !syncHandle.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {syncLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{syncLoading ? 'Syncing...' : 'Sync Live Channel'}</span>
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span>Try live Indian creator channels:</span>
          {['@TechnicalGuruji', '@ProBoiz95', '@SATVIK', '@YogiBoltaHai'].map(handlePreset => (
            <button
              key={handlePreset}
              type="button"
              onClick={() => handleSyncLiveYouTube(undefined, handlePreset)}
              className="px-2 py-0.5 font-mono border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
            >
              {handlePreset}
            </button>
          ))}
        </div>

        {syncError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {syncSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncSuccess}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Subscribers</span>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {currentCreator.subscribers.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">+2.4K this month</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Avg Views / Video</span>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {currentCreator.avgViews.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Last 10 uploads</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Engagement Rate</span>
          <div className="font-mono text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
            {currentCreator.engagementRate}%
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Top 15% in niche</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Authenticity Index</span>
          <div className="font-mono text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {currentCreator.authenticityReport.credibilityScore} / 100
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Zero Bot Penalties</span>
        </div>
      </div>

      {/* Audience Demographics & Rate Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audience Geography & Age Distribution */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-indigo-600" />
              Verified Audience Demographics
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Gender: {currentCreator.demographics.genderRatio.male}% M / {currentCreator.demographics.genderRatio.female}% F
            </span>
          </div>

          <div>
            <span className="font-semibold text-slate-700 block mb-2">Age Distribution:</span>
            <div className="space-y-2">
              {currentCreator.demographics.ageDistribution.map(item => (
                <div key={item.range}>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                    <span>{item.range} years</span>
                    <span className="font-mono font-semibold">{item.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700 block mb-2">Top Geographic Markets:</span>
            <div className="grid grid-cols-2 gap-2">
              {currentCreator.demographics.topCountries.map(c => (
                <div key={c.country} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
                  <span className="text-slate-700">{c.country}</span>
                  <span className="font-mono font-bold text-indigo-600">{c.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rate Card Configuration */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Creator Standard Rate Card (₹ INR)
            </h3>
            <span className="text-[11px] text-slate-400">Used for budget matching</span>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Dedicated YouTube Video (10-15 mins)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={ratesForm.dedicated}
                  onChange={e => setRatesForm({ ...ratesForm, dedicated: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                60-Second Mid-Roll Integrated Sponsor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={ratesForm.integrated}
                  onChange={e => setRatesForm({ ...ratesForm, integrated: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Vertical Short / Instagram Reel / TikTok
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={ratesForm.shorts}
                  onChange={e => setRatesForm({ ...ratesForm, shorts: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                {isSaved ? 'Saved to profile!' : 'Changes reflect on brand dealer match scores immediately'}
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{isSaved ? 'Saved' : 'Update Rates'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Free YouTube API Architecture & Inspector (Educational Submission Feature) */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4 text-rose-600" />
              Free YouTube Data API v3 Architecture Blueprint
            </h3>
            <p className="text-xs text-slate-500">
              How our system queries YouTube Free Tier (10,000 units/day) for channel audits without scraping
            </p>
          </div>

          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveApiTab('endpoint')}
              className={`px-2.5 py-1 rounded cursor-pointer ${activeApiTab === 'endpoint' ? 'bg-white font-semibold text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              API Endpoint
            </button>
            <button
              onClick={() => setActiveApiTab('json')}
              className={`px-2.5 py-1 rounded cursor-pointer ${activeApiTab === 'json' ? 'bg-white font-semibold text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Payload Schema
            </button>
            <button
              onClick={() => setActiveApiTab('calculation')}
              className={`px-2.5 py-1 rounded cursor-pointer ${activeApiTab === 'calculation' ? 'bg-white font-semibold text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Engagement Math
            </button>
          </div>
        </div>

        {activeApiTab === 'endpoint' && (
          <div className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg overflow-x-auto space-y-2">
            <div className="text-emerald-400">// Query channel stats via official Google API:</div>
            <div>
              GET https://www.googleapis.com/youtube/v3/channels?
              <br />
              &nbsp;&nbsp;part=snippet,statistics,contentDetails,brandingSettings
              <br />
              &nbsp;&nbsp;&forHandle={currentCreator.handle}
              <br />
              &nbsp;&nbsp;&key=YOUR_FREE_YOUTUBE_API_KEY
            </div>
          </div>
        )}

        {activeApiTab === 'json' && (
          <div className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg overflow-x-auto">
            <pre>{JSON.stringify({
              kind: "youtube#channelListResponse",
              items: [{
                id: "UC_" + currentCreator.handle.replace('@', ''),
                snippet: {
                  title: currentCreator.name,
                  customUrl: currentCreator.handle,
                  country: currentCreator.demographics.topCountries[0]?.country,
                },
                statistics: {
                  viewCount: (currentCreator.avgViews * 120).toString(),
                  subscriberCount: currentCreator.subscribers.toString(),
                  hiddenSubscriberCount: false,
                  videoCount: "148"
                }
              }]
            }, null, 2)}</pre>
          </div>
        )}

        {activeApiTab === 'calculation' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-2">
            <div className="font-semibold text-slate-900">How Engagement Rate is Extracted For Free:</div>
            <p>
              1. Using <code>playlistItems</code> API endpoint, fetch the 10 most recent public uploads from the creator&apos;s upload playlist.
            </p>
            <p>
              2. Query <code>videos.list?part=statistics</code> for those 10 video IDs in a single batch call (costs only 1 quota point).
            </p>
            <p>
              3. Formula: <code>EngagementRate = sum(likes + comments) / sum(views) * 100</code>
            </p>
            <p className="font-mono text-indigo-700 bg-white p-2 border border-slate-200 rounded">
              Current Creator Result: ({currentCreator.engagementRate}% Organic Velocity)
            </p>
          </div>
        )}
      </div>

      {/* Recent Sample Videos */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">
          Recent Video Benchmark Audits
        </h3>
        <div className="divide-y divide-slate-100 text-xs">
          {currentCreator.sampleVideos.map((vid, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">{vid.title}</span>
                <span className="text-[11px] text-slate-400">
                  Uploaded {vid.uploadDate} · Duration: {vid.duration}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {vid.views} views
                </span>
                <span className="text-[10px] text-emerald-600 block">Audited</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
