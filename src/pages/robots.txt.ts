import type { APIRoute } from 'astro';
import { SITES } from '../lib/sites';

/* ------------------------------------------------------------------ */
/* robots.txt — AI-crawler friendly.                                   */
/* data.guotan.com is a public, structured, citable dataset: */
/* search and AI crawlers are explicitly allowed.                      */
/* ------------------------------------------------------------------ */

const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Googlebot',
  'Bingbot',
  'CCBot',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'Meta-ExternalAgent',
  'cohere-ai',
  'DuckAssistBot',
  'MistralAI-User',
  'AI2Bot',
];

export const GET: APIRoute = () => {
  const origin = SITES.data;

  const lines: string[] = [
    '# robots.txt for data.guotan.com',
    '# Structured charcoal product and specification dataset.',
    '# Public, citable content: AI and search crawlers are welcome.',
    '',
    'User-agent: *',
    'Allow: /',
    '',
  ];

  for (const bot of AI_CRAWLERS) {
    lines.push(`User-agent: ${bot}`, 'Allow: /', '');
  }

  lines.push(`Sitemap: ${origin}/sitemap-index.xml`, '');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
