import { verifyYouTubeDeliverableVideo } from '../_lib/youtube.js';

export default async function handler(req: any, res: any) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const url = typeof body.url === 'string'
      ? body.url.trim()
      : typeof req.query?.url === 'string'
      ? req.query.url.trim()
      : '';

    if (!url) {
      return res.status(400).json({
        error: 'Please provide a YouTube video URL or video ID via ?url= or JSON body { url }.',
      });
    }

    const expectedCreatorHandle = typeof body.expectedCreatorHandle === 'string'
      ? body.expectedCreatorHandle.trim()
      : typeof req.query?.handle === 'string'
      ? req.query.handle.trim()
      : undefined;

    const expectedCreatorName = typeof body.expectedCreatorName === 'string'
      ? body.expectedCreatorName.trim()
      : typeof req.query?.creatorName === 'string'
      ? req.query.creatorName.trim()
      : undefined;

    let expectedKeywords: string[] = [];
    if (Array.isArray(body.expectedKeywords)) {
      expectedKeywords = body.expectedKeywords.map((k: unknown) => String(k));
    } else if (typeof req.query?.keywords === 'string') {
      expectedKeywords = req.query.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }

    const result = await verifyYouTubeDeliverableVideo({
      url,
      expectedCreatorHandle,
      expectedCreatorName,
      expectedKeywords,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    return res.status(status).json({
      error: err?.message || 'Failed to verify YouTube deliverable video.',
      reason: err?.reason || 'unknown',
    });
  }
}
