// scripts/generate-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';

// Basic public routes
const ORIGIN = process.env.SITE_ORIGIN || 'https://netaniadelaiya.com';
const staticPaths = ['/', '/rooms', '/about-us', '/contact-us', '/policy'];

// Attempt to pull dynamic room slugs from backend if env provided
async function fetchRoomSlugs() {
  const apiBase = process.env.API_BASE; // e.g., https://api.netaniadelaiya.com/api/v1
  if (!apiBase) return [];
  try {
    const res = await fetch(`${apiBase}/rooms`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list.map((r) => r.slug || r.room_slug || r.id).filter(Boolean);
  } catch {
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
  const dynamicPaths = roomSlugs.map((slug) => `/rooms/${slug}`);
  const urls = [...staticPaths, ...dynamicPaths];

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

