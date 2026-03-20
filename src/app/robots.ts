// robots.txt — allow public pages, block dashboard and API routes

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/feed', '/keywords', '/subreddits', '/templates', '/analytics', '/settings', '/billing', '/onboarding', '/api/'],
    },
    sitemap: 'https://subhuntr.com/sitemap.xml',
  }
}
