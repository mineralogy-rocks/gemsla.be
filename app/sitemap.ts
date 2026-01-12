import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: 'https://gemsla.be',
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
		{
			url: 'https://gemsla.be/contact',
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.8,
		},
		{
			url: 'https://gemsla.be/pricing',
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.8,
		},
	]
}
