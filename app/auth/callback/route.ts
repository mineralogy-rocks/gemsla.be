import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getBaseUrl(request: Request): string {
	const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'
	const forwardedHost = request.headers.get('x-forwarded-host')
	const forwardedProto = request.headers.get('x-forwarded-proto') || 'http'

	if (forwardedHost) {
		const derived = `${forwardedProto}://${forwardedHost}`
		if (derived === allowedOrigin) {
			return derived
		}
	}

	return allowedOrigin
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const code = searchParams.get('code')
	const next = searchParams.get('next') ?? '/dashboard'
	const baseUrl = getBaseUrl(request)

	if (code) {
		const supabase = await createClient()
		const { error } = await supabase.auth.exchangeCodeForSession(code)

		if (!error) {
			const { data: { user } } = await supabase.auth.getUser()

			const isOAuthSignIn = user?.app_metadata?.provider === 'google'
				|| user?.identities?.some(i => i.provider === 'google')

			if (isOAuthSignIn && user?.app_metadata?.role !== 'admin') {
				await supabase.auth.signOut()
				return NextResponse.redirect(`${baseUrl}/auth/sign-in?error=unauthorized`)
			}

			return NextResponse.redirect(`${baseUrl}${next}`)
		}
	}

	return NextResponse.redirect(`${baseUrl}/error?message=Could not authenticate`)
}
