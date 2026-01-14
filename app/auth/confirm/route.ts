import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getBaseUrl(request: Request): string {
	const forwardedHost = request.headers.get('x-forwarded-host')
	const forwardedProto = request.headers.get('x-forwarded-proto') || 'http'

	if (forwardedHost) {
		return `${forwardedProto}://${forwardedHost}`
	}

	return new URL(request.url).origin
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const token_hash = searchParams.get('token_hash')
	const type = searchParams.get('type') as EmailOtpType | null
	const next = searchParams.get('next') ?? '/dashboard'
	const baseUrl = getBaseUrl(request)

	if (token_hash && type) {
		const supabase = await createClient()
		const { error } = await supabase.auth.verifyOtp({ type, token_hash })

		if (!error) {
			return NextResponse.redirect(`${baseUrl}${next}`)
		}
	}

	return NextResponse.redirect(`${baseUrl}/error?type=auth_error&message=Could not verify your request`)
}
