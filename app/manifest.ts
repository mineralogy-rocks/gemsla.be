import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'GemsLabé - Gemological Services & Consulting',
		short_name: 'GemsLabé',
		description: 'Professional gemological services by Olena Rybnikova, PhD in Mineralogy. GIA Applied Jewelry Professional.',
		start_url: '/',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: '#5c5c5c',
		icons: [
			{
				src: '/web-app-manifest-192x192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/web-app-manifest-512x512.png',
				sizes: '512x512',
				type: 'image/png',
			},
		],
	}
}
