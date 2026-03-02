'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'

export async function signIn(formData: FormData) {
	const supabase = await createClient()

	const email = formData.get('email') as string
	const password = formData.get('password') as string

	if (!email || !password) {
		return { error: 'Email and password are required' }
	}

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	})

	if (error) {
		return { error: error.message }
	}

	revalidatePath('/', 'layout')
	redirect('/dashboard')
}

export async function signOut() {
	const supabase = await createClient()

	const { error } = await supabase.auth.signOut()

	if (error) {
		return { error: error.message }
	}

	revalidatePath('/', 'layout')
	redirect('/')
}

export async function resetPassword(formData: FormData) {
	const supabase = await createClient()

	const email = formData.get('email') as string

	if (!email) {
		return { error: 'Email is required' }
	}

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${baseUrl}/auth/callback?next=/auth/sign-in/update-password`,
	})

	if (error) {
		return { error: error.message }
	}

	return { success: true }
}

export async function signInWithGoogle() {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${baseUrl}/auth/callback`,
		},
	})

	if (error) {
		return { error: error.message }
	}

	if (!data.url) {
		return { error: 'Could not initiate Google sign-in' }
	}

	redirect(data.url)
}

export async function updatePassword(formData: FormData) {
	const supabase = await createClient()

	const password = formData.get('password') as string
	const confirmPassword = formData.get('confirmPassword') as string

	if (!password || !confirmPassword) {
		return { error: 'Password and confirmation are required' }
	}

	if (password !== confirmPassword) {
		return { error: 'Passwords do not match' }
	}

	if (password.length < 6) {
		return { error: 'Password must be at least 6 characters' }
	}

	const { error } = await supabase.auth.updateUser({
		password,
	})

	if (error) {
		return { error: error.message }
	}

	revalidatePath('/', 'layout')
	redirect('/dashboard')
}
