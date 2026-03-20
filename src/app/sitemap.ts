// Sitemap for SEO — lists all public pages

import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://subhuntr.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://subhuntr.com/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://subhuntr.com/signup', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://subhuntr.com/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://subhuntr.com/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://subhuntr.com/contact', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
