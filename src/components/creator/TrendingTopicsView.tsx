import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Filter,
  Lightbulb,
  Search,
  ExternalLink,
  RefreshCw,
  Database,
  Youtube,
  TrendingUp,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';

interface KaggleVideo {
  video_id: string;
  title: string;
  channel: string;
  published_at: string;
  category_id: number;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
  category: string;
  sentiment: number;
  sentiment_label: 'positive' | 'neutral' | 'negative';
  engagementRate: number;
}

interface CategorySummary {
  category: string;
  videoCount: number;
  totalViews: number;
  avgViews: number;
  avgEngagementRate: number;
  avgSentiment: number;
  sentimentCounts: { positive: number; neutral: number; negative: number };
  topTags: { tag: string; count: number }[];
  topChannels: { channel: string; views: number }[];
}

interface DerivedDatasetTopic {
  id: string;
  topic: string;
  niche: string;
  category: string;
  avgViews: number;
  avgEngagementRate: number;
  videoCount: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  creatorAngle: string;
  commercialSponsorDemand: 'Very High' | 'High' | 'Emerging';
  keyKeywords: string[];
  sampleVideos: {
    video_id: string;
    title: string;
    channel: string;
    views: number;
    likes: number;
    comments: number;
  }[];
}

interface LiveTrendingVideo {
  video_id: string;
  title: string;
  channel: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  thumbnail: string;
  engagementRate: number;
  tags: string[];
}

interface TrendsApiResponse {
  source: string;
  totalRecords: number;
  categories: CategorySummary[];
  derivedTopics: DerivedDatasetTopic[];
  videos: KaggleVideo[];
  liveTrending: LiveTrendingVideo[];
  liveError: string | null;
  youtubeApiConfigured: boolean;
}

function formatCompact(n: number): string {
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export const TrendingTopicsView: React.FC = () => {
  const { currentCreator } = useApp();

  const [viewMode, setViewMode] = useState<'clusters' | 'dataset' | 'live_yt'>('clusters');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sentimentFilter, setSentimentFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savedIdeas, setSavedIdeas] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [data, setData] = useState<TrendsApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingLive, setLoadingLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async (withLive = false) => {
    try {
      if (withLive) setLoadingLive(true);
      else setLoading(true);
      setError(null);

      const res = await fetch(`/api/trends?category=All${withLive ? '&live=true&region=IN' : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load trending dataset');
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch trending data');
    } finally {
      setLoading(false);
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchTrends(false);
  }, []);

  const handleLoadLiveYouTube = () => {
    setViewMode('live_yt');
    if (!data?.liveTrending || data.liveTrending.length === 0) {
      fetchTrends(true);
    }
  };

  const filteredTopics = useMemo(() => {
    const topics = data?.derivedTopics || [];
    if (selectedCategory === 'All') return topics;
    return topics.filter(t => t.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [data, selectedCategory]);

  const filteredVideos = useMemo(() => {
    const videos = data?.videos || [];
    return videos.filter(v => {
      if (selectedCategory !== 'All' && v.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (sentimentFilter !== 'All' && v.sentiment_label !== sentimentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hit =
          v.title.toLowerCase().includes(q) ||
          v.channel.toLowerCase().includes(q) ||
          v.tags.some(t => t.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [data, selectedCategory, sentimentFilter, searchQuery]);

  const toggleSaveIdea = (id: string) => {
    setSavedIdeas(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const copyAngle = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-amber-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              Real Indian YouTube Trending Intelligence
            </span>
            <span aria-hidden="true">·</span>
            <span>{data?.source || 'Kaggle Indian YouTube Trending Dataset (2024–25)'}</span>
            {data && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{data.totalRecords} records indexed</span>
              </>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Trending Video Topics & Sentiment Analytics for {currentCreator.name}
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Derived directly from your Indian YouTube Trending CSV (views, likes, comments, VADER sentiment, and regional tags) plus live YouTube India charts.
          </p>
        </div>

        {/* Sub-view Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('clusters')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'clusters' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Topic Clusters
          </button>
          <button
            onClick={() => setViewMode('dataset')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'dataset' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dataset Videos ({data?.totalRecords ?? 0})
          </button>
          <button
            onClick={handleLoadLiveYouTube}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              viewMode === 'live_yt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-600" />
            <span>Live YouTube IN</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchTrends(false)}
            className="px-3 py-1 bg-white border border-rose-300 rounded font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Category Benchmark Strip */}
      {!loading && data && viewMode !== 'live_yt' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.categories.map(cat => {
            const isActive = selectedCategory === cat.category;
            return (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(isActive ? 'All' : cat.category)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold truncate">{cat.category}</span>
                  <span className={`font-mono tabular-nums ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                    {cat.videoCount}
                  </span>
                </div>
                <div className="font-mono text-base font-bold mt-1 tabular-nums">
                  {formatCompact(cat.avgViews)} avg
                </div>
                <div className={`text-[10px] font-mono tabular-nums mt-0.5 ${isActive ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {cat.avgEngagementRate}% eng · {cat.avgSentiment >= 0 ? '+' : ''}{cat.avgSentiment} sent
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW 1: Derived Topic Clusters */}
      {!loading && data && viewMode === 'clusters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {filteredTopics.length} data-backed content clusters
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ' across all Kaggle categories'}
            </span>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                Clear category filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTopics.map(topic => {
              const isSaved = savedIdeas.includes(topic.id);
              const isCopied = copiedId === topic.id;

              return (
                <div
                  key={topic.id}
                  className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-700">{topic.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{topic.niche}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="font-bold text-emerald-700">
                          {formatCompact(topic.avgViews)} avg views
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600">{topic.avgEngagementRate}% eng</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {topic.topic}
                    </h3>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-3 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        Recommended Video Angle & Brand Fit:
                      </div>
                      <p className="text-slate-600">{topic.creatorAngle}</p>
                    </div>

                    {/* Top real videos from dataset */}
                    {topic.sampleVideos.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Top Trending Evidence from CSV ({topic.videoCount} videos)
                        </span>
                        {topic.sampleVideos.map(sv => (
                          <a
                            key={sv.video_id}
                            href={`https://www.youtube.com/watch?v=${sv.video_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-2 text-[11px] p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors"
                          >
                            <span className="truncate text-slate-800 font-medium">{sv.title}</span>
                            <span className="font-mono text-slate-500 shrink-0 tabular-nums">
                              {formatCompact(sv.views)} views
                            </span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Keywords */}
                    <div className="mt-3 flex flex-wrap gap-2 items-center text-[11px] text-slate-500">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tags:</span>
                      {topic.keyKeywords.map((kw, i) => (
                        <span key={i} className="font-mono text-slate-700">
                          #{kw}
                          {i < topic.keyKeywords.length - 1 ? ' ·' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-500">
                      Sponsor Demand: <strong className="text-slate-800">{topic.commercialSponsorDemand}</strong>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      Sentiment: <strong className="text-slate-800 capitalize">{topic.sentimentLabel}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyAngle(topic.id, `${topic.topic}: ${topic.creatorAngle}`)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md bg-white hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                      >
                        {isCopied ? 'Copied!' : 'Copy Pitch'}
                      </button>

                      <button
                        onClick={() => toggleSaveIdea(topic.id)}
                        className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          isSaved ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isSaved ? 'Saved' : 'Save Concept'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Full Kaggle CSV Video Explorer */}
      {!loading && data && viewMode === 'dataset' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search video title, channel, tag..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none"
              >
                <option value="All">All Categories</option>
                {data.categories.map(c => (
                  <option key={c.category} value={c.category}>
                    {c.category} ({c.videoCount})
                  </option>
                ))}
              </select>

              <select
                value={sentimentFilter}
                onChange={e => setSentimentFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none"
              >
                <option value="All">All Sentiments</option>
                <option value="positive">Positive Sentiment</option>
                <option value="neutral">Neutral Sentiment</option>
                <option value="negative">Negative Sentiment</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {filteredVideos.length} of {data.totalRecords} videos
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Video & Channel</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Views</th>
                  <th className="py-2.5 px-3 text-right">Likes</th>
                  <th className="py-2.5 px-3 text-right">Comments</th>
                  <th className="py-2.5 px-3 text-right">Eng. Rate</th>
                  <th className="py-2.5 px-4 text-right">Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVideos.map(v => (
                  <tr key={v.video_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 max-w-md">
                      <a
                        href={`https://www.youtube.com/watch?v=${v.video_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1 flex items-center gap-1"
                      >
                        <span className="truncate">{v.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                      </a>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {v.channel} · {v.published_at.split(' ')[0]}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{v.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatCompact(v.views)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatCompact(v.likes)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatCompact(v.comments)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-indigo-600">
                      {v.engagementRate}%
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-mono text-[11px] font-semibold capitalize ${
                          v.sentiment_label === 'positive'
                            ? 'text-emerald-700'
                            : v.sentiment_label === 'negative'
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {v.sentiment_label} ({v.sentiment})
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredVideos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No dataset rows match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Live YouTube India Most Popular */}
      {viewMode === 'live_yt' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Youtube className="w-4 h-4 text-rose-600" />
                Live YouTube India Most Popular Feed (YouTube Data API v3)
              </h3>
              <p className="text-xs text-slate-500">
                Real-time regional trending videos fetched server-side via <code>videos.list?chart=mostPopular&amp;regionCode=IN</code>
              </p>
            </div>
            <button
              onClick={() => fetchTrends(true)}
              disabled={loadingLive}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin' : ''}`} />
              <span>{loadingLive ? 'Fetching Live...' : 'Refresh Live Feed'}</span>
            </button>
          </div>

          {data?.liveError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <strong>Live Feed Notice:</strong> {data.liveError} (Ensure <code>YOUTUBE_API_KEY</code> is saved in AI Studio Secrets and the server has been restarted.)
            </div>
          )}

          {loadingLive && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-48 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!loadingLive && data?.liveTrending && data.liveTrending.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.liveTrending.map(v => (
                <a
                  key={v.video_id}
                  href={`https://www.youtube.com/watch?v=${v.video_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-400 transition-all flex flex-col justify-between bg-white"
                >
                  <div>
                    {v.thumbnail ? (
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        referrerPolicy="no-referrer"
                        className="w-full aspect-video object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        No Thumbnail
                      </div>
                    )}
                    <div className="p-3">
                      <div className="text-xs font-bold text-slate-900 line-clamp-2">{v.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{v.channel}</div>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600">
                    <span>{formatCompact(v.views)} views</span>
                    <span className="text-indigo-600 font-semibold">{v.engagementRate}% eng</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
