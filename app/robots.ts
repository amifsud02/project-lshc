import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo/site'

/** Admin, API and per-visitor pages: nothing there for search engines or AI assistants. */
const DISALLOW = ['/admin', '/api/', '/account', '/cart', '/checkout', '/login/verify', '/logout', '/styleguide']

/**
 * AI search and assistant crawlers, named so it is explicit that the club wants its news,
 * fixtures and club information to be found and cited in AI answers (generative engine
 * optimisation). A crawler follows only the most specific group that names it, so each
 * gets the same rules as everyone else.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'DuckAssistBot',
  'meta-externalagent',
  'MistralAI-User',
  'CCBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
