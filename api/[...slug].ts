import app from '../server';

export default function handler(req: any, res: any) {
  // If Vercel passed dynamic slug array, reconstruct canonical /api URL
  if (req.query?.slug) {
    const slugPath = Array.isArray(req.query.slug) ? req.query.slug.join('/') : req.query.slug;
    const queryIdx = req.url?.indexOf('?') ?? -1;
    const search = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    req.url = `/api/${slugPath}${search}`;
  } else if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/oauth')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}
