import { loadKaggleTrendingVideos } from './_lib/trendingDataset.ts';

export default async function handler(_req: any, res: any) {
  try {
    const records = loadKaggleTrendingVideos();
    return res.status(200).json({
      status: 'ok',
      youtubeApiConfigured: Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim()),
      datasetLoaded: true,
      datasetRecords: records.length,
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      message: err?.message || 'Health check failed',
    });
  }
}
