export function normalizeSearchResults<T>(data: unknown): T[] {
	if (!data || typeof data !== "object") return [];
	const d = data as Record<string, unknown>;
	if (Array.isArray(d.results)) return d.results as T[];
	if (Array.isArray(d.stones)) return d.stones as T[];
	if (Array.isArray(d.reports)) return d.reports as T[];
	return [];
}
