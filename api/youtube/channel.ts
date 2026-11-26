import { lookupYouTubeChannel } from '../_lib/youtube.ts';

export default async function handler(req: any, res: any) {
  try {
    const handle = typeof req.query?.handle === 'string' ? req.query.handle.trim() : '';
    const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
    const query = handle || q;

    if (!query) {
      return res.status(400).json({
        error: 'Please provide a channel @handle, channel URL, channel ID, or channel name via ?handle=...',
      });
    }

    const result = await lookupYouTubeChannel(query);
    return res.status(200).json(result);
  } catch (err: any) {
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    return res.status(status).json({
      error: err?.message || 'Failed to audit YouTube channel.',
      reason: err?.reason || 'unknown',
    });
  }
}
