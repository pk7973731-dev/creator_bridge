const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideoSample {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  thumbnail: string;
}

export interface LiveChannelAuditResult {
  channelId: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  country: string;
  channelUrl: string;
  publishedAt: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number; // (avgLikes + avgComments) / avgViews * 100
  viewToSubRatio: number; // avgViews / subscribers * 100
  suggestedRatesInr: {
    dedicatedVideo: number;
    integrated60s: number;
    shortsReels: number;
  };
  inferredNiche: 'Tech & Gadgets' | 'Beauty & Skincare' | 'Fitness & Health' | 'Finance & Crypto' | 'Gaming & Hardware' | 'Food & Cooking' | 'Travel & Lifestyle';
  recentVideos: YouTubeVideoSample[];
  authenticityReport: {
    riskLevel: 'VERIFIED_SAFE' | 'MODERATE_CAUTION' | 'HIGH_RISK_SUSPICIOUS';
    credibilityScore: number;
    fakeFollowersEstimatePct: number;
    engagementAnomaly: 'Normal' | 'Mild Discrepancy' | 'Severe Discrepancy';
    botPatternCount: number;
    growthCurveType: 'Organic Continuous' | 'Gradual Viral' | 'Abrupt Bot Spike';
    commentAuthenticityScore: number;
    auditFlags: string[];
    scanDate: string;
  };
  quotaUsedEstimate: number;
}

export interface LiveYouTubeSearchItem {
  channelId: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  country: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  inferredNiche: LiveChannelAuditResult['inferredNiche'];
  estimatedIntegratedRateInr: number;
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !key.trim()) {
    throw new Error('YOUTUBE_API_KEY is not configured in server environment secrets.');
  }
  return key.trim();
}

async function ytFetch(endpoint: string, params: Record<string, string>): Promise<any> {
  const key = getApiKey();
  const url = new URL(`${YT_API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, v);
  }
  url.searchParams.set('key', key);

  const response = await fetch(url.toString());
  const data = (await response.json()) as any;

  if (!response.ok) {
    const reason = data?.error?.errors?.[0]?.reason || 'api_error';
    const message = data?.error?.message || `YouTube API returned HTTP ${response.status}`;
    const err = new Error(message) as Error & { status?: number; reason?: string };
    err.status = response.status;
    err.reason = reason;
    throw err;
  }

  return data;
}

export function inferNicheFromText(text: string): LiveChannelAuditResult['inferredNiche'] {
  const t = text.toLowerCase();
  if (/(game|gaming|bgmi|minecraft|gta|valorant|esports|ps5|pc build|fps)/.test(t)) return 'Gaming & Hardware';
  if (/(tech|gadget|phone|laptop|review|unbox|ai |software|coding|camera|audio)/.test(t)) return 'Tech & Gadgets';
  if (/(skin|beauty|makeup|glow|serum|cosmetic|haircare|fashion)/.test(t)) return 'Beauty & Skincare';
  if (/(fitness|gym|workout|nutrition|protein|yoga|health|running)/.test(t)) return 'Fitness & Health';
  if (/(finance|stock|invest|crypto|money|tax|business|startup|trading)/.test(t)) return 'Finance & Crypto';
  if (/(cook|recipe|food|kitchen|biryani|chef|street food)/.test(t)) return 'Food & Cooking';
  return 'Travel & Lifestyle';
}

function parseChannelQuery(input: string): { type: 'id' | 'handle' | 'search'; value: string } {
  const trimmed = input.trim();

  // Check URL patterns
  if (trimmed.includes('youtube.com/') || trimmed.includes('youtu.be/')) {
    const channelMatch = trimmed.match(/youtube\.com\/channel\/(UC[\w-]+)/i);
    if (channelMatch) return { type: 'id', value: channelMatch[1] };

    const handleMatch = trimmed.match(/youtube\.com\/(@[\w.-]+)/i);
    if (handleMatch) return { type: 'handle', value: handleMatch[1] };

    const customMatch = trimmed.match(/youtube\.com\/(?:c\/|user\/)?([\w.-]+)/i);
    if (customMatch && !['watch', 'shorts', 'playlist'].includes(customMatch[1].toLowerCase())) {
      return { type: 'search', value: customMatch[1] };
    }
  }

  if (/^UC[\w-]{18,}$/.test(trimmed)) {
    return { type: 'id', value: trimmed };
  }

  if (trimmed.startsWith('@')) {
    return { type: 'handle', value: trimmed };
  }

  // If single token without spaces, try handle first or search
  if (!trimmed.includes(' ')) {
    return { type: 'handle', value: `@${trimmed}` };
  }

  return { type: 'search', value: trimmed };
}

function runLiveFraudHeuristics(
  subscribers: number,
  avgViews: number,
  avgLikes: number,
  avgComments: number,
  recentVideos: YouTubeVideoSample[]
): LiveChannelAuditResult['authenticityReport'] {
  const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;
  const viewToSubPct = subscribers > 0 ? (avgViews / subscribers) * 100 : 0;
  const commentToLikeRatio = avgLikes > 0 ? avgComments / avgLikes : 0;

  let credibility = 94;
  let fakeFollowersPct = 2.5;
  let anomaly: 'Normal' | 'Mild Discrepancy' | 'Severe Discrepancy' = 'Normal';
  let botPatterns = 0;
  let growthCurve: 'Organic Continuous' | 'Gradual Viral' | 'Abrupt Bot Spike' = 'Organic Continuous';
  const auditFlags: string[] = [];

  // 1. View-to-Subscriber health (real organic creators usually pull >5% of sub count per video, or >2% for mega channels)
  if (subscribers >= 100000 && viewToSubPct < 1.2) {
    credibility -= 28;
    fakeFollowersPct += 26;
    anomaly = 'Severe Discrepancy';
    botPatterns += 140;
    growthCurve = 'Abrupt Bot Spike';
    auditFlags.push(`Severe view-to-subscriber disconnect: avg views (${avgViews.toLocaleString()}) are only ${viewToSubPct.toFixed(2)}% of ${subscribers.toLocaleString()} subscribers.`);
  } else if (subscribers >= 50000 && viewToSubPct < 3.0) {
    credibility -= 12;
    fakeFollowersPct += 10;
    anomaly = 'Mild Discrepancy';
    auditFlags.push(`Below-benchmark view velocity (${viewToSubPct.toFixed(1)}% of subscriber base per upload).`);
  } else {
    auditFlags.push(`Healthy live view-to-subscriber ratio (${viewToSubPct.toFixed(1)}% per recent video).`);
  }

  // 2. Engagement rate on views ((likes + comments)/views)
  if (avgViews > 10000 && engagementRate < 0.8) {
    credibility -= 22;
    fakeFollowersPct += 18;
    if (anomaly === 'Normal') anomaly = 'Mild Discrepancy';
    botPatterns += 75;
    auditFlags.push(`Low viewer interaction rate (${engagementRate.toFixed(2)}% likes+comments per view).`);
  } else if (engagementRate >= 2.5) {
    credibility = Math.min(99, credibility + 3);
    auditFlags.push(`Strong live audience interaction (${engagementRate.toFixed(2)}% engagement across recent uploads).`);
  } else {
    auditFlags.push(`Standard engagement velocity (${engagementRate.toFixed(2)}% across recent uploads).`);
  }

  // 3. Comment-to-Like ratio (detects like-farm inflation or disabled comments)
  if (avgLikes > 500 && commentToLikeRatio < 0.005) {
    credibility -= 14;
    fakeFollowersPct += 11;
    botPatterns += 45;
    auditFlags.push(`Unusually low comment-to-like ratio (${(commentToLikeRatio * 100).toFixed(2)}%), common in paid like boosts.`);
  } else if (avgComments > 0) {
    auditFlags.push(`Active viewer discussion (${avgComments.toLocaleString()} avg comments per video).`);
  }

  // 4. Consistency across recent uploads (checks if 1 outlier inflates avgViews)
  if (recentVideos.length >= 4) {
    const viewList = recentVideos.map(v => v.views).sort((a, b) => a - b);
    const median = viewList[Math.floor(viewList.length / 2)];
    if (median > 0 && avgViews > median * 4) {
      growthCurve = 'Gradual Viral';
      auditFlags.push(`Recent viral outlier detected: average views (${avgViews.toLocaleString()}) exceed median (${median.toLocaleString()}) by >4x.`);
    }
  }

  const finalCredibility = Math.max(15, Math.min(99, Math.round(credibility)));
  let riskLevel: 'VERIFIED_SAFE' | 'MODERATE_CAUTION' | 'HIGH_RISK_SUSPICIOUS' = 'VERIFIED_SAFE';
  if (finalCredibility < 55 || fakeFollowersPct > 30) {
    riskLevel = 'HIGH_RISK_SUSPICIOUS';
  } else if (finalCredibility < 78 || fakeFollowersPct > 15) {
    riskLevel = 'MODERATE_CAUTION';
  }

  return {
    riskLevel,
    credibilityScore: finalCredibility,
    fakeFollowersEstimatePct: Number(Math.min(75, fakeFollowersPct).toFixed(1)),
    engagementAnomaly: anomaly,
    botPatternCount: botPatterns,
    growthCurveType: growthCurve,
    commentAuthenticityScore: Math.max(15, Math.min(99, finalCredibility - 1)),
    auditFlags,
    scanDate: new Date().toISOString().split('T')[0],
  };
}

export async function lookupYouTubeChannel(query: string): Promise<LiveChannelAuditResult> {
  const parsed = parseChannelQuery(query);
  let quotaUsed = 0;
  let channelItem: any = null;

  if (parsed.type === 'id') {
    const res = await ytFetch('channels', {
      part: 'snippet,statistics,contentDetails,topicDetails',
      id: parsed.value,
    });
    quotaUsed += 1;
    channelItem = res.items?.[0];
  } else if (parsed.type === 'handle') {
    const res = await ytFetch('channels', {
      part: 'snippet,statistics,contentDetails,topicDetails',
      forHandle: parsed.value,
    });
    quotaUsed += 1;
    channelItem = res.items?.[0];

    // Fallback to search if handle wasn't found verbatim
    if (!channelItem) {
      const searchRes = await ytFetch('search', {
        part: 'snippet',
        type: 'channel',
        q: parsed.value.replace(/^@/, ''),
        maxResults: '1',
      });
      quotaUsed += 100;
      const foundId = searchRes.items?.[0]?.id?.channelId;
      if (foundId) {
        const chRes = await ytFetch('channels', {
          part: 'snippet,statistics,contentDetails,topicDetails',
          id: foundId,
        });
        quotaUsed += 1;
        channelItem = chRes.items?.[0];
      }
    }
  } else {
    const searchRes = await ytFetch('search', {
      part: 'snippet',
      type: 'channel',
      q: parsed.value,
      maxResults: '1',
    });
    quotaUsed += 100;
    const foundId = searchRes.items?.[0]?.id?.channelId;
    if (foundId) {
      const chRes = await ytFetch('channels', {
        part: 'snippet,statistics,contentDetails,topicDetails',
        id: foundId,
      });
      quotaUsed += 1;
      channelItem = chRes.items?.[0];
    }
  }

  if (!channelItem) {
    const err = new Error(`No YouTube channel found matching "${query}".`) as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  const snippet = channelItem.snippet || {};
  const stats = channelItem.statistics || {};
  const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;

  const subscribers = Number(stats.subscriberCount) || 0;
  const totalViews = Number(stats.viewCount) || 0;
  const videoCount = Number(stats.videoCount) || 0;

  let recentVideos: YouTubeVideoSample[] = [];
  if (uploadsPlaylistId) {
    const plRes = await ytFetch('playlistItems', {
      part: 'contentDetails,snippet',
      playlistId: uploadsPlaylistId,
      maxResults: '10',
    });
    quotaUsed += 1;

    const videoIds = (plRes.items || [])
      .map((it: any) => it.contentDetails?.videoId)
      .filter(Boolean);

    if (videoIds.length > 0) {
      const vidRes = await ytFetch('videos', {
        part: 'snippet,statistics',
        id: videoIds.join(','),
      });
      quotaUsed += 1;

      recentVideos = (vidRes.items || []).map((v: any) => {
        const vw = Number(v.statistics?.viewCount) || 0;
        const lk = Number(v.statistics?.likeCount) || 0;
        const cm = Number(v.statistics?.commentCount) || 0;
        return {
          id: v.id,
          title: v.snippet?.title || 'Untitled',
          publishedAt: v.snippet?.publishedAt || '',
          views: vw,
          likes: lk,
          comments: cm,
          engagementRate: vw > 0 ? Number((((lk + cm) / vw) * 100).toFixed(2)) : 0,
          thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
        };
      });
    }
  }

  const avgViews = recentVideos.length > 0
    ? Math.round(recentVideos.reduce((s, v) => s + v.views, 0) / recentVideos.length)
    : videoCount > 0 ? Math.round(totalViews / videoCount) : 0;

  const avgLikes = recentVideos.length > 0
    ? Math.round(recentVideos.reduce((s, v) => s + v.likes, 0) / recentVideos.length)
    : 0;

  const avgComments = recentVideos.length > 0
    ? Math.round(recentVideos.reduce((s, v) => s + v.comments, 0) / recentVideos.length)
    : 0;

  const engagementRate = avgViews > 0
    ? Number((((avgLikes + avgComments) / avgViews) * 100).toFixed(2))
    : 0;

  const viewToSubRatio = subscribers > 0
    ? Number(((avgViews / subscribers) * 100).toFixed(2))
    : 0;

  const handle = snippet.customUrl
    ? (snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`)
    : `@${(snippet.title || 'creator').replace(/\s+/g, '')}`;

  const combinedText = `${snippet.title || ''} ${snippet.description || ''} ${recentVideos.map(v => v.title).join(' ')}`;
  const inferredNiche = inferNicheFromText(combinedText);

  // Estimate fair ₹ INR sponsorship rates from live avg views (CPV model capped reasonably for MSMEs)
  const baseIntegrated = Math.max(800, Math.min(250000, Math.round((avgViews / 100) * 3.5 / 100) * 100));
  const suggestedRatesInr = {
    dedicatedVideo: Math.round(baseIntegrated * 1.85),
    integrated60s: baseIntegrated,
    shortsReels: Math.max(500, Math.round(baseIntegrated * 0.45)),
  };

  const authenticityReport = runLiveFraudHeuristics(
    subscribers,
    avgViews,
    avgLikes,
    avgComments,
    recentVideos
  );

  return {
    channelId: channelItem.id,
    name: snippet.title || handle,
    handle,
    description: snippet.description || '',
    avatar: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    country: snippet.country || 'IN',
    channelUrl: `https://youtube.com/channel/${channelItem.id}`,
    publishedAt: snippet.publishedAt || '',
    subscribers,
    totalViews,
    videoCount,
    avgViews,
    avgLikes,
    avgComments,
    engagementRate,
    viewToSubRatio,
    suggestedRatesInr,
    inferredNiche,
    recentVideos,
    authenticityReport,
    quotaUsedEstimate: quotaUsed,
  };
}

export async function searchYouTubeChannels(query: string, regionCode = 'IN'): Promise<LiveYouTubeSearchItem[]> {
  const searchRes = await ytFetch('search', {
    part: 'snippet',
    type: 'channel',
    q: query,
    regionCode,
    maxResults: '8',
  });

  const channelIds = (searchRes.items || [])
    .map((item: any) => item.id?.channelId)
    .filter(Boolean);

  if (channelIds.length === 0) return [];

  const chRes = await ytFetch('channels', {
    part: 'snippet,statistics',
    id: channelIds.join(','),
  });

  return (chRes.items || []).map((ch: any) => {
    const snippet = ch.snippet || {};
    const stats = ch.statistics || {};
    const subscribers = Number(stats.subscriberCount) || 0;
    const totalViews = Number(stats.viewCount) || 0;
    const videoCount = Math.max(Number(stats.videoCount) || 1, 1);
    const estAvgViews = Math.round(totalViews / videoCount);
    const estimatedIntegratedRateInr = Math.max(800, Math.min(200000, Math.round((estAvgViews / 100) * 3 / 100) * 100));

    const handle = snippet.customUrl
      ? (snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`)
      : `@${(snippet.title || 'creator').replace(/\s+/g, '')}`;

    return {
      channelId: ch.id,
      name: snippet.title || 'YouTube Channel',
      handle,
      description: snippet.description || '',
      avatar: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      country: snippet.country || regionCode,
      subscribers,
      totalViews,
      videoCount,
      inferredNiche: inferNicheFromText(`${snippet.title || ''} ${snippet.description || ''}`),
      estimatedIntegratedRateInr,
    };
  });
}

export async function fetchLiveYouTubeTrending(regionCode = 'IN') {
  const res = await ytFetch('videos', {
    part: 'snippet,statistics',
    chart: 'mostPopular',
    regionCode,
    maxResults: '12',
  });

  return (res.items || []).map((v: any) => {
    const views = Number(v.statistics?.viewCount) || 0;
    const likes = Number(v.statistics?.likeCount) || 0;
    const comments = Number(v.statistics?.commentCount) || 0;
    return {
      video_id: v.id,
      title: v.snippet?.title || '',
      channel: v.snippet?.channelTitle || '',
      published_at: v.snippet?.publishedAt || '',
      category_id: Number(v.snippet?.categoryId) || 0,
      tags: Array.isArray(v.snippet?.tags) ? v.snippet.tags.slice(0, 8) : [],
      views,
      likes,
      comments,
      thumbnail: v.snippet?.thumbnails?.medium?.url || '',
      engagementRate: views > 0 ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0,
    };
  });
}

export interface DeliverableVerificationCheck {
  key: 'video_exists' | 'privacy_status' | 'channel_match' | 'disclosure_check' | 'brand_keyword_match';
  label: string;
  passed: boolean;
  severity: 'pass' | 'warning' | 'fail';
  detail: string;
}

export interface DeliverableVerificationResult {
  found: boolean;
  videoId: string;
  videoUrl: string;
  title?: string;
  channelId?: string;
  channelTitle?: string;
  channelHandle?: string;
  publishedAt?: string;
  durationFormatted?: string;
  durationSeconds?: number;
  privacyStatus?: string;
  views?: number;
  likes?: number;
  comments?: number;
  thumbnail?: string;
  disclosureDetected: boolean;
  matchedDisclosures: string[];
  channelMatched: boolean | null;
  matchedKeywords: string[];
  verificationStatus: 'VERIFIED' | 'PARTIAL_WARNING' | 'FAILED';
  summary: string;
  checks: DeliverableVerificationCheck[];
  verifiedAt: string;
}

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(segments[0])) {
        const id = segments[1];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    // Fallback regex
  }

  const fallback = trimmed.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})/);
  return fallback ? fallback[1] : null;
}

function parseIsoDuration(iso: string): { formatted: string; seconds: number } {
  const match = (iso || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { formatted: '0:00', seconds: 0 };
  const hours = Number(match[1] || 0);
  const mins = Number(match[2] || 0);
  const secs = Number(match[3] || 0);
  const total = hours * 3600 + mins * 60 + secs;
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = hours > 0 ? `${hours}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
  return { formatted, seconds: total };
}

export async function verifyYouTubeDeliverableVideo(params: {
  url: string;
  expectedCreatorHandle?: string;
  expectedCreatorName?: string;
  expectedKeywords?: string[];
}): Promise<DeliverableVerificationResult> {
  const videoId = extractYouTubeVideoId(params.url);
  if (!videoId) {
    const err = new Error('Invalid YouTube video URL or video ID. Provide a valid youtube.com/watch?v=..., youtu.be/..., or Shorts URL.') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const verifiedAt = new Date().toISOString();
  const vidRes = await ytFetch('videos', {
    part: 'snippet,contentDetails,statistics,status',
    id: videoId,
  });

  const item = vidRes.items?.[0];
  if (!item) {
    return {
      found: false,
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      disclosureDetected: false,
      matchedDisclosures: [],
      channelMatched: false,
      matchedKeywords: [],
      verificationStatus: 'FAILED',
      summary: `Video ${videoId} was not found or is Private/Deleted on YouTube.`,
      checks: [
        {
          key: 'video_exists',
          label: 'YouTube Video Availability',
          passed: false,
          severity: 'fail',
          detail: 'No public or unlisted video metadata returned by YouTube Data API v3.',
        },
      ],
      verifiedAt,
    };
  }

  const snippet = item.snippet || {};
  const status = item.status || {};
  const stats = item.statistics || {};
  const contentDetails = item.contentDetails || {};

  const privacyStatus = String(status.privacyStatus || 'public').toLowerCase();
  const privacyOk = privacyStatus === 'public' || privacyStatus === 'unlisted';

  const duration = parseIsoDuration(contentDetails.duration || '');
  const views = Number(stats.viewCount) || 0;
  const likes = Number(stats.likeCount) || 0;
  const comments = Number(stats.commentCount) || 0;

  let channelHandle = '';
  if (snippet.channelId) {
    try {
      const chRes = await ytFetch('channels', {
        part: 'snippet',
        id: snippet.channelId,
      });
      const chCustom = chRes.items?.[0]?.snippet?.customUrl;
      if (chCustom) {
        channelHandle = chCustom.startsWith('@') ? chCustom : `@${chCustom}`;
      }
    } catch {
      // Non-fatal if channel handle lookup fails
    }
  }

  // Channel ownership match check
  let channelMatched: boolean | null = null;
  let channelDetail = `Published by ${snippet.channelTitle || 'Unknown Channel'}${channelHandle ? ` (${channelHandle})` : ''}`;
  if (params.expectedCreatorHandle || params.expectedCreatorName) {
    const cleanExpectedHandle = (params.expectedCreatorHandle || '').replace(/^@/, '').toLowerCase().trim();
    const cleanActualHandle = channelHandle.replace(/^@/, '').toLowerCase().trim();
    const cleanExpectedName = (params.expectedCreatorName || '').toLowerCase().trim();
    const cleanActualTitle = (snippet.channelTitle || '').toLowerCase().trim();

    const handleMatches = Boolean(cleanExpectedHandle && cleanActualHandle && (
      cleanActualHandle === cleanExpectedHandle ||
      cleanActualHandle.includes(cleanExpectedHandle) ||
      cleanExpectedHandle.includes(cleanActualHandle)
    ));
    const nameMatches = Boolean(
      (cleanExpectedName && cleanActualTitle && (cleanActualTitle.includes(cleanExpectedName) || cleanExpectedName.includes(cleanActualTitle))) ||
      (cleanExpectedHandle && cleanActualTitle.replace(/\s+/g, '').includes(cleanExpectedHandle.replace(/\s+/g, '')))
    );

    channelMatched = handleMatches || nameMatches;
    channelDetail = channelMatched
      ? `Confirmed channel match: ${snippet.channelTitle}${channelHandle ? ` (${channelHandle})` : ''}.`
      : `Channel mismatch: video belongs to "${snippet.channelTitle}" (${channelHandle || 'no handle'}), expected ${params.expectedCreatorHandle || params.expectedCreatorName}.`;
  }

  // ASCI / FTC Sponsorship Disclosure check
  const fullText = `${snippet.title || ''}\n${snippet.description || ''}\n${Array.isArray(snippet.tags) ? snippet.tags.join(' ') : ''}`;
  const lowerText = fullText.toLowerCase();
  const disclosurePatterns = [
    '#ad',
    '#sponsored',
    '#paidpartnership',
    '#paidpromotion',
    '#collab',
    'paid promotion',
    'paid partnership',
    'sponsored by',
    'in partnership with',
    'sponsored video',
    'includes paid promotion',
    'affiliate link',
  ];
  const matchedDisclosures = disclosurePatterns.filter(p => lowerText.includes(p));
  const disclosureDetected = matchedDisclosures.length > 0;

  // Brand / Campaign keyword match
  const rawKeywords = (params.expectedKeywords || [])
    .flatMap(k => k.split(/[\s,/|-]+/))
    .map(w => w.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length >= 3 && !['the', 'and', 'for', 'with', 'video', 'youtube', 'launch', 'dedicated', 'integrated', 'sponsor', 'shorts', 'reels', 'package'].includes(w));
  const uniqueKeywords = Array.from(new Set(rawKeywords)).slice(0, 12);
  const matchedKeywords = uniqueKeywords.filter(kw => lowerText.includes(kw));

  const checks: DeliverableVerificationCheck[] = [
    {
      key: 'video_exists',
      label: 'Live YouTube Video Detected',
      passed: true,
      severity: 'pass',
      detail: `"${snippet.title}" (${duration.formatted}) · ${views.toLocaleString()} views`,
    },
    {
      key: 'privacy_status',
      label: 'Deliverable Visibility Status',
      passed: privacyOk,
      severity: privacyOk ? 'pass' : 'fail',
      detail: privacyOk
        ? `Video is ${privacyStatus.toUpperCase()} and accessible for review.`
        : `Video privacy is "${privacyStatus}". Must be Public or Unlisted.`,
    },
    {
      key: 'channel_match',
      label: 'Creator Channel Ownership',
      passed: channelMatched !== false,
      severity: channelMatched === false ? 'fail' : 'pass',
      detail: channelDetail,
    },
    {
      key: 'disclosure_check',
      label: 'FTC / ASCI Sponsorship Disclosure (#ad)',
      passed: disclosureDetected,
      severity: disclosureDetected ? 'pass' : 'warning',
      detail: disclosureDetected
        ? `Disclosure detected in metadata: ${matchedDisclosures.slice(0, 3).join(', ')}`
        : 'No #ad, #sponsored, or paid partnership tag found in video title/description.',
    },
    {
      key: 'brand_keyword_match',
      label: 'Campaign / Brand Keyword Mention',
      passed: uniqueKeywords.length === 0 || matchedKeywords.length > 0,
      severity: uniqueKeywords.length === 0 || matchedKeywords.length > 0 ? 'pass' : 'warning',
      detail:
        uniqueKeywords.length === 0
          ? 'No campaign filter keywords provided.'
          : matchedKeywords.length > 0
          ? `Matched campaign keywords in description/title: ${matchedKeywords.join(', ')}`
          : `None of the campaign keywords (${uniqueKeywords.slice(0, 4).join(', ')}) appeared in title or description.`,
    },
  ];

  const hasHardFail = !privacyOk || channelMatched === false;
  const hasWarning = !disclosureDetected || (uniqueKeywords.length > 0 && matchedKeywords.length === 0);

  const verificationStatus: DeliverableVerificationResult['verificationStatus'] = hasHardFail
    ? 'FAILED'
    : hasWarning
    ? 'PARTIAL_WARNING'
    : 'VERIFIED';

  const summary = hasHardFail
    ? `Failed audit: ${!privacyOk ? 'Video is private.' : channelDetail}`
    : hasWarning
    ? `Video live (${views.toLocaleString()} views, ${duration.formatted}), but ${!disclosureDetected ? '#ad disclosure missing' : 'brand keywords not found in description'}.`
    : `Verified live (${privacyStatus}, ${duration.formatted}, ${views.toLocaleString()} views) with ${matchedDisclosures[0] || '#ad'} disclosure & brand keywords.`;

  return {
    found: true,
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: snippet.title || 'Untitled Video',
    channelId: snippet.channelId || '',
    channelTitle: snippet.channelTitle || '',
    channelHandle,
    publishedAt: snippet.publishedAt || '',
    durationFormatted: duration.formatted,
    durationSeconds: duration.seconds,
    privacyStatus,
    views,
    likes,
    comments,
    thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    disclosureDetected,
    matchedDisclosures,
    channelMatched,
    matchedKeywords,
    verificationStatus,
    summary: summary.slice(0, 480),
    checks,
    verifiedAt,
  };
}

