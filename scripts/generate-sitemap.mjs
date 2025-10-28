// scripts/generate-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';

// Basic public routes with SEO priorities for sitelinks
const ORIGIN = process.env.SITE_ORIGIN || 'https://www.netaniadelaiya.com';
const staticPaths = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/rooms', priority: '0.9', changefreq: 'weekly' },
  { path: '/day-tour', priority: '0.9', changefreq: 'weekly' },
  { path: '/contact-us', priority: '0.8', changefreq: 'monthly' },
  { path: '/policy', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { path: '/terms', priority: '0.5', changefreq: 'yearly' }
];

// Attempt to pull dynamic room slugs from backend if env provided
async function fetchRoomSlugs() {
  // Try multiple environment variable sources for backend URL
  const apiBase = process.env.VITE_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.APP_URL ||
    'https://api.netaniadelaiya.com';

  if (!apiBase) return [];

  try {
    const res = await fetch(`${apiBase}/api/v1/rooms`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list.map((r) => r.slug || r.room_slug || r.id).filter(Boolean);
  } catch (error) {
    console.error('Failed to fetch room slugs:', error.message);
    return [];
  }
}
async function fetchDayTourRoomSlugs() {
  // Try multiple environment variable sources for backend URL
  const apiBase = process.env.VITE_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.APP_URL ||
    'https://api.netaniadelaiya.com';

  if (!apiBase) return [];

  try {
    const res = await fetch(`${apiBase}/api/v1/rooms?room_type=day_tour`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list.map((r) => r.slug || r.room_slug || r.id).filter(Boolean);
  } catch (error) {
    console.error('Failed to fetch day tour room slugs:', error.message);
    return [];
  }
}

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function main() {
  const roomSlugs = await fetchRoomSlugs();
  const dayTourRoomSlugs = await fetchDayTourRoomSlugs();
  
  // Convert static paths to URL objects
  const staticUrls = staticPaths.map(route => ({
    path: route.path,
    priority: route.priority,
    changefreq: route.changefreq
  }));
  
  // Add dynamic room paths
  const dynamicUrls = roomSlugs.map((slug) => ({
    path: `/rooms/${slug}`,
    priority: '0.8',
    changefreq: 'weekly'
  }));
  
  // Add dynamic day tour room paths
  const dayTourDynamicUrls = dayTourRoomSlugs.map((slug) => ({
    path: `/day-tour/${slug}`,
    priority: '0.8',
    changefreq: 'weekly'
  }));
  
  const allUrls = [...staticUrls, ...dynamicUrls, ...dayTourDynamicUrls];

  const today = new Date().toISOString();
  const body = allUrls
    .map((url) => `  <url>\n    <loc>${xmlEscape(ORIGIN + url.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`Sitemap written to ${outPath}`);
}

await main();

