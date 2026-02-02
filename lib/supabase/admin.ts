import { createClient } from "./server";

/**
 * Check if the current authenticated user has admin role
 * Checks app_metadata.role === 'admin' (more secure than user_metadata)
 * app_metadata can only be set via admin API, not by users
 */
export async function isAdmin(): Promise<boolean> {
	const supabase = await createClient();
	const { data: { user }, error } = await supabase.auth.getUser();

	if (error || !user) {
		return false;
	}

	return user.app_metadata?.role === "admin";
}

/**
 * Get current user if they are an admin, otherwise return null
 */
export async function getAdminUser() {
	const supabase = await createClient();
	const { data: { user }, error } = await supabase.auth.getUser();

	if (error || !user) {
		return null;
	}

	if (user.app_metadata?.role !== "admin") {
		return null;
	}

	return user;
}
