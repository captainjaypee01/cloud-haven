// scripts/generate-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';

// Basic public routes
const ORIGIN = process.env.SITE_ORIGIN || 'https://www.netaniadelaiya.com';
const staticPaths = ['/', '/rooms', '/day-tour', '/contact-us', '/policy', '/privacy', '/terms'];

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
    console.log('Failed to fetch room slugs:', error.message);
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
    console.log('Failed to fetch day tour room slugs:', error.message);
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
  const dynamicPaths = roomSlugs.map((slug) => `/rooms/${slug}`);
  const dayTourDynamicPaths = dayTourRoomSlugs.map((slug) => `/day-tour/${slug}`);
  const urls = [...staticPaths, ...dynamicPaths, ...dayTourDynamicPaths];

  const today = new Date().toISOString();
  const body = urls
    .map((u) => `  <url>\n    <loc>${xmlEscape(ORIGIN + u)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u === '/' ? 'daily' : 'weekly'}</changefreq>\n    <priority>${u === '/' ? '1.0' : '0.8'}</priority>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`Sitemap written to ${outPath}`);
}

await main();

