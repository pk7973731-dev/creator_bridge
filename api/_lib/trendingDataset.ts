import { INDIAN_YOUTUBE_TRENDING_DATA } from '../_data/indian_youtube_trending.js';

export interface KaggleTrendingVideo {
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

export interface CategorySummary {
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

export interface DerivedDatasetTopic {
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
  sampleVideos: { video_id: string; title: string; channel: string; views: number; likes: number; comments: number }[];
}

interface RawTrendingRow {
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
  sentiment_label: string;
}

let cachedRows: KaggleTrendingVideo[] | null = null;

export function loadKaggleTrendingVideos(): KaggleTrendingVideo[] {
  if (cachedRows) return cachedRows;

  const parsed = INDIAN_YOUTUBE_TRENDING_DATA as RawTrendingRow[];

  cachedRows = parsed.map(item => {
    const views = Math.max(Number(item.views) || 0, 0);
    const likes = Math.max(Number(item.likes) || 0, 0);
    const comments = Math.max(Number(item.comments) || 0, 0);
    const engagementRate = views > 0 ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0;
    const label = item.sentiment_label === 'positive' || item.sentiment_label === 'negative'
      ? item.sentiment_label
      : 'neutral';

    return {
      ...item,
      views,
      likes,
      comments,
      sentiment_label: label,
      engagementRate,
    };
  });

  return cachedRows;
}

export function getTrendingDatasetAnalytics(categoryFilter?: string) {
  const allVideos = loadKaggleTrendingVideos();
  const filteredVideos = categoryFilter && categoryFilter !== 'All'
    ? allVideos.filter(v => v.category.toLowerCase() === categoryFilter.toLowerCase())
    : allVideos;

  // Build category summaries from full dataset
  const byCategory = new Map<string, KaggleTrendingVideo[]>();
  for (const v of allVideos) {
    const list = byCategory.get(v.category) || [];
    list.push(v);
    byCategory.set(v.category, list);
  }

  const categories: CategorySummary[] = [];
  for (const [cat, list] of byCategory.entries()) {
    const totalViews = list.reduce((s, v) => s + v.views, 0);
    const avgViews = Math.round(totalViews / list.length);
    const avgEngagementRate = Number(
      (list.reduce((s, v) => s + v.engagementRate, 0) / list.length).toFixed(2)
    );
    const avgSentiment = Number(
      (list.reduce((s, v) => s + v.sentiment, 0) / list.length).toFixed(3)
    );

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const tagFreq = new Map<string, number>();
    const channelViews = new Map<string, number>();

    for (const v of list) {
      sentimentCounts[v.sentiment_label]++;
      channelViews.set(v.channel, (channelViews.get(v.channel) || 0) + v.views);
      for (const t of v.tags) {
        const clean = t.toLowerCase().trim();
        if (clean.length > 2) {
          tagFreq.set(clean, (tagFreq.get(clean) || 0) + 1);
        }
      }
    }

    const topTags = Array.from(tagFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));

    const topChannels = Array.from(channelViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([channel, views]) => ({ channel, views }));

    categories.push({
      category: cat,
      videoCount: list.length,
      totalViews,
      avgViews,
      avgEngagementRate,
      avgSentiment,
      sentimentCounts,
      topTags,
      topChannels,
    });
  }

  categories.sort((a, b) => b.totalViews - a.totalViews);

  // Derive real actionable creator topic clusters directly from the 49 Indian trending videos
  const derivedTopics = deriveTopicsFromDataset(allVideos);

  return {
    source: 'Kaggle Indian YouTube Trending Dataset (2024–25)',
    totalRecords: allVideos.length,
    categories,
    derivedTopics,
    videos: filteredVideos,
  };
}

function deriveTopicsFromDataset(videos: KaggleTrendingVideo[]): DerivedDatasetTopic[] {
  const clusterDefs: {
    id: string;
    topic: string;
    niche: string;
    category: string;
    match: (v: KaggleTrendingVideo) => boolean;
    angle: string;
    demand: 'Very High' | 'High' | 'Emerging';
    fallbackKeywords: string[];
  }[] = [
    {
      id: 'kaggle_gaming_minecraft',
      topic: 'Minecraft Mystery & Challenge Storytelling (Hindi/English)',
      niche: 'Gaming & Hardware',
      category: 'Gaming',
      match: v => v.category === 'Gaming' && (v.title.toLowerCase().includes('minecraft') || v.tags.some(t => t.toLowerCase().includes('minecraft'))),
      angle: 'High-retention challenge or myth-busting narrative with fast-paced thumbnail hooks.',
      demand: 'Very High',
      fallbackKeywords: ['minecraft', 'mythbusters', 'gaming challenge', 'proboiz'],
    },
    {
      id: 'kaggle_gaming_esports',
      topic: 'BGMI & Mobile Esports Tournament Live Watch-Alongs',
      niche: 'Gaming & Hardware',
      category: 'Gaming',
      match: v => v.category === 'Gaming' && (
        v.title.toLowerCase().includes('bgmi') ||
        v.title.toLowerCase().includes('finals') ||
        v.title.toLowerCase().includes('championship') ||
        v.title.toLowerCase().includes('grandmaster')
      ),
      angle: 'Live tournament analysis, pro-loadout breakdowns, and mobile gaming phone/earbud sponsor integrations.',
      demand: 'Very High',
      fallbackKeywords: ['bgmi', 'esports', 'grandmaster', 'mobile gaming'],
    },
    {
      id: 'kaggle_gaming_gta',
      topic: 'GTA 5 Character Roleplay & Modded Comedy Skits',
      niche: 'Gaming & Hardware',
      category: 'Gaming',
      match: v => v.category === 'Gaming' && (v.title.toLowerCase().includes('gta') || v.tags.some(t => t.toLowerCase().includes('gta'))),
      angle: 'Regional Hindi comedy storytelling inside GTA V mods—strong family/youth retention for D2C snack & peripheral sponsors.',
      demand: 'High',
      fallbackKeywords: ['gta 5', 'shinchan gta', 'roleplay', 'hindi gaming'],
    },
    {
      id: 'kaggle_ent_ott',
      topic: 'OTT Web-Series Trailer Breakdowns & Easter Eggs',
      niche: 'Tech & Gadgets',
      category: 'Entertainment',
      match: v => v.category === 'Entertainment' && (
        v.title.toLowerCase().includes('trailer') ||
        v.title.toLowerCase().includes('teaser') ||
        v.title.toLowerCase().includes('breakdown')
      ),
      angle: 'Frame-by-frame regional language (Tamil/Hindi) breakdowns within 12 hours of Prime Video & Netflix drops.',
      demand: 'Very High',
      fallbackKeywords: ['trailer breakdown', 'ott india', 'tamil review', 'netflix'],
    },
    {
      id: 'kaggle_music_regional',
      topic: 'Regional South & North Indian Music / Trailer Reaction & Audio Reviews',
      niche: 'Travel & Lifestyle',
      category: 'Music',
      match: v => v.category === 'Music',
      angle: 'Telugu, Tamil, Punjabi & Haryanvi music releases dominate Indian trending views—ideal for audio gear & lifestyle integrations.',
      demand: 'High',
      fallbackKeywords: ['regional music', 'telugu hits', 'punjabi songs', 'audio review'],
    },
    {
      id: 'kaggle_news_cinema',
      topic: 'Cinema Box-Office Fact-Checks & Trailer Verification Commentary',
      niche: 'Finance & Crypto',
      category: 'News & Politics',
      match: v => v.category === 'News & Politics' || v.category === 'Film & Animation',
      angle: 'Data-backed box-office & viral claim fact-checks—attracts fintech, consumer utility, and EdTech sponsorships.',
      demand: 'Emerging',
      fallbackKeywords: ['box office analysis', 'fact check', 'film trailer', 'trending india'],
    },
  ];

  return clusterDefs.map(def => {
    const matched = videos.filter(def.match);
    const list = matched.length > 0 ? matched : videos.filter(v => v.category === def.category);
    const avgViews = list.length > 0 ? Math.round(list.reduce((s, v) => s + v.views, 0) / list.length) : 0;
    const avgEngagementRate = list.length > 0
      ? Number((list.reduce((s, v) => s + v.engagementRate, 0) / list.length).toFixed(2))
      : 0;
    const avgSent = list.length > 0 ? list.reduce((s, v) => s + v.sentiment, 0) / list.length : 0;
    const sentimentLabel: 'positive' | 'neutral' | 'negative' =
      avgSent > 0.1 ? 'positive' : avgSent < -0.1 ? 'negative' : 'neutral';

    const tagCounts = new Map<string, number>();
    for (const v of list) {
      for (const t of v.tags) {
        const clean = t.trim();
        if (clean.length > 2 && clean.length < 28) {
          tagCounts.set(clean, (tagCounts.get(clean) || 0) + 1);
        }
      }
    }
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t]) => t);

    return {
      id: def.id,
      topic: def.topic,
      niche: def.niche,
      category: def.category,
      avgViews,
      avgEngagementRate,
      videoCount: list.length,
      sentimentLabel,
      creatorAngle: def.angle,
      commercialSponsorDemand: def.demand,
      keyKeywords: topTags.length > 0 ? topTags : def.fallbackKeywords,
      sampleVideos: list
        .sort((a, b) => b.views - a.views)
        .slice(0, 3)
        .map(v => ({
          video_id: v.video_id,
          title: v.title,
          channel: v.channel,
          views: v.views,
          likes: v.likes,
          comments: v.comments,
        })),
    };
  });
}
