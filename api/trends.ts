import { getTrendingDatasetAnalytics } from './_lib/trendingDataset.ts';
import { fetchLiveYouTubeTrending } from './_lib/youtube.ts';

export default async function handler(req: any, res: any) {
  try {
    const category = typeof req.query?.category === 'string' ? req.query.category : 'All';
    const includeLive = req.query?.live === 'true' || req.query?.live === '1';
    const region = typeof req.query?.region === 'string' ? req.query.region : 'IN';

    const datasetAnalytics = getTrendingDatasetAnalytics(category);

    let liveTrending: any[] = [];
    let liveError: string | null = null;

    if (includeLive) {
      if (!process.env.YOUTUBE_API_KEY) {
        liveError = 'YOUTUBE_API_KEY not configured in Secrets.';
      } else {
        try {
          liveTrending = await fetchLiveYouTubeTrending(region);
        } catch (err: any) {
          liveError = err?.message || 'Failed to fetch live YouTube trending.';
        }
      }
    }

    return res.status(200).json({
      ...datasetAnalytics,
      liveTrending,
      liveError,
      youtubeApiConfigured: Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim()),
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || 'Failed to load trending dataset.',
    });
  }
}
