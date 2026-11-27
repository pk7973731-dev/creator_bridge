import { searchYouTubeChannels } from '../_lib/youtube.js';

export default async function handler(req: any, res: any) {
  try {
    const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
    const regionCode = typeof req.query?.region === 'string' ? req.query.region : 'IN';

    if (!q) {
      return res.status(400).json({
        error: 'Please provide a search query (?q=...)',
      });
    }

    const channels = await searchYouTubeChannels(q, regionCode);
    return res.status(200).json({
      query: q,
      regionCode,
      channels,
    });
  } catch (err: any) {
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    return res.status(status).json({
      error: err?.message || 'Failed to search YouTube channels.',
      reason: err?.reason || 'unknown',
    });
  }
}
